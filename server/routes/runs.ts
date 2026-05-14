import { Router } from "express";
import { query } from "../db.js";
import { decrypt } from "../lib/crypto.js";
import { streamChatCompletion, chatCompletion, type ProviderType, type ChatMessage } from "../lib/providers.js";

const router = Router();

async function resolveProvider(projectId: string, userId: string): Promise<{ provider: ProviderType; apiKey: string } | null> {
  const { rows: projRows } = await query("SELECT workspace_id FROM projects WHERE id = $1", [projectId]);
  if (projRows.length === 0) return null;

  const wsId = projRows[0].workspace_id;
  const table = wsId ? "workspaces" : "users";
  const idCol = wsId ? "id" : "id";
  const idVal = wsId || userId;

  const { rows } = await query(
    `SELECT llm_provider, llm_api_key_enc, llm_api_key_iv, llm_api_key_tag FROM ${table} WHERE ${idCol} = $1`,
    [idVal]
  );
  if (rows.length === 0 || !rows[0].llm_provider) return null;

  const apiKey = decrypt(rows[0].llm_api_key_enc, rows[0].llm_api_key_iv, rows[0].llm_api_key_tag);
  return { provider: rows[0].llm_provider as ProviderType, apiKey };
}

async function canAccessProject(projectId: string, userId: string): Promise<boolean> {
  const { rows } = await query(
    `SELECT 1 FROM projects p
     WHERE p.id = $1 AND (
       p.user_id = $2
       OR EXISTS (
         SELECT 1 FROM workspace_members wm
         WHERE wm.workspace_id = p.workspace_id AND wm.user_id = $2
       )
     )`,
    [projectId, userId]
  );
  return rows.length > 0;
}

router.get("/projects/:id/runs", async (req, res) => {
  if (!(await canAccessProject(req.params.id, req.userId!))) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
  const offset = parseInt(req.query.offset as string) || 0;
  const { rows } = await query(
    `SELECT * FROM eval_runs
     WHERE project_id = $1
     ORDER BY created_at DESC
     LIMIT $2 OFFSET $3`,
    [req.params.id, limit, offset]
  );
  res.json(rows);
});

router.post("/projects/:id/runs", async (req, res) => {
  if (!(await canAccessProject(req.params.id, req.userId!))) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  const { model_tag, system_prompt, user_input } = req.body;
  if (!model_tag) {
    res.status(400).json({ error: "model_tag is required" });
    return;
  }

  const providerInfo = await resolveProvider(req.params.id, req.userId!);
  if (!providerInfo) {
    res.status(400).json({ error: "Kein API-Provider konfiguriert" });
    return;
  }

  const { rows: runRows } = await query(
    `INSERT INTO eval_runs (project_id, model_tag, system_prompt, user_input, status)
     VALUES ($1, $2, $3, $4, 'running') RETURNING *`,
    [req.params.id, model_tag, system_prompt || "", user_input || ""]
  );
  const run = runRows[0];

  const messages: ChatMessage[] = [];
  if (system_prompt) messages.push({ role: "system", content: system_prompt });
  messages.push({ role: "user", content: user_input || "" });

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Run-Id", run.id);
  res.flushHeaders();

  const startTime = Date.now();
  let fullOutput = "";

  try {
    const llmRes = await streamChatCompletion(providerInfo.provider, providerInfo.apiKey, model_tag, messages);

    if (!llmRes.body) throw new Error("No response body from provider");

    const reader = llmRes.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const payload = line.slice(6).trim();
        if (payload === "[DONE]") continue;

        try {
          const parsed = JSON.parse(payload);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) {
            fullOutput += content;
            res.write(`data: ${JSON.stringify({ chunk: content })}\n\n`);
          }
        } catch {
          // skip malformed chunks
        }
      }
    }

    const latencyMs = Date.now() - startTime;
    await query(
      `UPDATE eval_runs SET output_text = $1, latency_ms = $2 WHERE id = $3`,
      [fullOutput, latencyMs, run.id]
    );
    res.write(`data: ${JSON.stringify({ done: true, run_id: run.id, latency_ms: latencyMs })}\n\n`);

    // --- Phase 2: Judge evaluation ---
    const { rows: projRows } = await query(
      "SELECT judge_model, eval_system_prompt, eval_user_prompt FROM projects WHERE id = $1",
      [req.params.id]
    );
    const proj = projRows[0];

    if (proj?.judge_model && proj.eval_user_prompt) {
      res.write(`data: ${JSON.stringify({ eval_started: true })}\n\n`);

      try {
        const { rows: criteriaRows } = await query(
          "SELECT id, title, description, weight FROM criteria WHERE project_id = $1 ORDER BY sort_order",
          [req.params.id]
        );

        const criteriaText = criteriaRows
          .map((c: any) => `- ${c.title} (Gewichtung: ${c.weight}%): ${c.description}`)
          .join("\n");

        const evalUserPrompt = proj.eval_user_prompt
          .replace(/\{\{output\}\}/g, fullOutput)
          .replace(/\{\{criteria\}\}/g, criteriaText);
        const evalSystemPrompt = (proj.eval_system_prompt || "")
          .replace(/\{\{output\}\}/g, fullOutput)
          .replace(/\{\{criteria\}\}/g, criteriaText);

        const evalMessages: ChatMessage[] = [];
        if (evalSystemPrompt) evalMessages.push({ role: "system", content: evalSystemPrompt });
        evalMessages.push({ role: "user", content: evalUserPrompt });

        const evalResponse = await chatCompletion(
          providerInfo.provider, providerInfo.apiKey, proj.judge_model, evalMessages
        );

        // Parse JSON — handle markdown code blocks
        const jsonMatch = evalResponse.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, evalResponse];
        const parsed = JSON.parse(jsonMatch[1]!.trim());

        const evalScores: { criteria_title: string; score: number; note?: string }[] = parsed.scores || [];
        let weightedSum = 0;
        let totalWeight = 0;

        for (const s of evalScores) {
          const criterion = criteriaRows.find((c: any) => c.title === s.criteria_title);
          if (!criterion) continue;

          const score = Math.max(0, Math.min(1, Number(s.score) || 0));
          await query(
            `INSERT INTO eval_scores (eval_run_id, criteria_id, score, note)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (eval_run_id, criteria_id) DO UPDATE SET score = $3, note = $4`,
            [run.id, criterion.id, score, s.note || null]
          );
          weightedSum += score * criterion.weight;
          totalWeight += criterion.weight;
        }

        const overallScore = totalWeight > 0 ? (weightedSum / totalWeight) * 100 : 0;
        await query(
          `UPDATE eval_runs SET overall_score = $1, summary_text = $2, status = 'completed' WHERE id = $3`,
          [overallScore.toFixed(2), parsed.summary || null, run.id]
        );

        res.write(`data: ${JSON.stringify({ eval_done: true, run_id: run.id })}\n\n`);
      } catch (evalErr: any) {
        await query(`UPDATE eval_runs SET status = 'completed' WHERE id = $1`, [run.id]);
        res.write(`data: ${JSON.stringify({ eval_error: evalErr.message || "Evaluierung fehlgeschlagen", run_id: run.id })}\n\n`);
      }
    } else {
      await query(`UPDATE eval_runs SET status = 'completed' WHERE id = $1`, [run.id]);
      res.write(`data: ${JSON.stringify({ eval_skipped: true, run_id: run.id })}\n\n`);
    }
  } catch (err: any) {
    await query(`UPDATE eval_runs SET status = 'failed' WHERE id = $1`, [run.id]);
    res.write(`data: ${JSON.stringify({ error: err.message || "LLM-Aufruf fehlgeschlagen" })}\n\n`);
  }

  res.end();
});

router.get("/projects/:id/runs/:rid", async (req, res) => {
  if (!(await canAccessProject(req.params.id, req.userId!))) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  const { rows: runRows } = await query(
    "SELECT * FROM eval_runs WHERE id = $1 AND project_id = $2",
    [req.params.rid, req.params.id]
  );
  if (runRows.length === 0) {
    res.status(404).json({ error: "Run not found" });
    return;
  }
  const { rows: scores } = await query(
    `SELECT es.*, c.title AS criteria_title, c.weight AS criteria_weight
     FROM eval_scores es
     JOIN criteria c ON c.id = es.criteria_id
     WHERE es.eval_run_id = $1
     ORDER BY c.sort_order`,
    [req.params.rid]
  );
  res.json({ ...runRows[0], scores });
});

export default router;
