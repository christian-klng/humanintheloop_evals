import { Router } from "express";
import { query } from "../db.js";
import { encrypt, decrypt, maskApiKey } from "../lib/crypto.js";
import { fetchModels, testConnection, type ProviderType } from "../lib/providers.js";

const router = Router();

const VALID_PROVIDERS = ["openrouter", "cortecs"];

async function isWorkspaceMember(workspaceId: string, userId: string): Promise<boolean> {
  const { rows } = await query(
    "SELECT 1 FROM workspace_members WHERE workspace_id = $1 AND user_id = $2",
    [workspaceId, userId]
  );
  return rows.length > 0;
}

router.get("/workspaces/:id/provider", async (req, res) => {
  if (!(await isWorkspaceMember(req.params.id, req.userId!))) {
    res.status(404).json({ error: "Arbeitsbereich nicht gefunden" });
    return;
  }

  const { rows } = await query(
    "SELECT llm_provider, llm_api_key_enc, llm_api_key_iv, llm_api_key_tag, llm_configured_at FROM workspaces WHERE id = $1",
    [req.params.id]
  );

  const ws = rows[0];
  if (!ws.llm_provider) {
    res.json({ provider: null });
    return;
  }

  const apiKey = decrypt(ws.llm_api_key_enc, ws.llm_api_key_iv, ws.llm_api_key_tag);
  res.json({
    provider: ws.llm_provider,
    api_key_masked: maskApiKey(apiKey),
    configured_at: ws.llm_configured_at,
  });
});

router.put("/workspaces/:id/provider", async (req, res) => {
  if (!(await isWorkspaceMember(req.params.id, req.userId!))) {
    res.status(404).json({ error: "Arbeitsbereich nicht gefunden" });
    return;
  }

  const { provider, api_key } = req.body;
  if (!provider || !VALID_PROVIDERS.includes(provider)) {
    res.status(400).json({ error: "Ungültiger Anbieter. Erlaubt: openrouter, cortecs" });
    return;
  }
  if (!api_key || typeof api_key !== "string" || api_key.trim().length < 8) {
    res.status(400).json({ error: "API-Schlüssel ist erforderlich (mind. 8 Zeichen)" });
    return;
  }

  const ok = await testConnection(provider as ProviderType, api_key.trim());
  if (!ok) {
    res.status(400).json({ error: "Verbindung fehlgeschlagen. Bitte überprüfe den API-Schlüssel." });
    return;
  }

  const { ciphertext, iv, tag } = encrypt(api_key.trim());

  const { rows } = await query(
    `UPDATE workspaces
     SET llm_provider = $1, llm_api_key_enc = $2, llm_api_key_iv = $3,
         llm_api_key_tag = $4, llm_configured_at = now()
     WHERE id = $5
     RETURNING llm_provider, llm_configured_at`,
    [provider, ciphertext, iv, tag, req.params.id]
  );

  res.json({
    provider: rows[0].llm_provider,
    api_key_masked: maskApiKey(api_key.trim()),
    configured_at: rows[0].llm_configured_at,
  });
});

router.delete("/workspaces/:id/provider", async (req, res) => {
  if (!(await isWorkspaceMember(req.params.id, req.userId!))) {
    res.status(404).json({ error: "Arbeitsbereich nicht gefunden" });
    return;
  }

  await query(
    `UPDATE workspaces
     SET llm_provider = NULL, llm_api_key_enc = NULL, llm_api_key_iv = NULL,
         llm_api_key_tag = NULL, llm_configured_at = NULL
     WHERE id = $1`,
    [req.params.id]
  );

  res.json({ ok: true });
});

router.post("/workspaces/:id/provider/test", async (req, res) => {
  if (!(await isWorkspaceMember(req.params.id, req.userId!))) {
    res.status(404).json({ error: "Arbeitsbereich nicht gefunden" });
    return;
  }

  const { rows } = await query(
    "SELECT llm_provider, llm_api_key_enc, llm_api_key_iv, llm_api_key_tag FROM workspaces WHERE id = $1",
    [req.params.id]
  );

  const ws = rows[0];
  if (!ws.llm_provider) {
    res.status(400).json({ ok: false, error: "Kein Anbieter konfiguriert" });
    return;
  }

  const apiKey = decrypt(ws.llm_api_key_enc, ws.llm_api_key_iv, ws.llm_api_key_tag);
  const ok = await testConnection(ws.llm_provider as ProviderType, apiKey);
  res.json({ ok, error: ok ? undefined : "Verbindung fehlgeschlagen" });
});

router.get("/workspaces/:id/provider/models", async (req, res) => {
  if (!(await isWorkspaceMember(req.params.id, req.userId!))) {
    res.status(404).json({ error: "Arbeitsbereich nicht gefunden" });
    return;
  }

  const { rows } = await query(
    "SELECT llm_provider, llm_api_key_enc, llm_api_key_iv, llm_api_key_tag FROM workspaces WHERE id = $1",
    [req.params.id]
  );

  const ws = rows[0];
  if (!ws.llm_provider) {
    res.status(400).json({ error: "Kein Anbieter konfiguriert", models: [] });
    return;
  }

  try {
    const apiKey = decrypt(ws.llm_api_key_enc, ws.llm_api_key_iv, ws.llm_api_key_tag);
    const models = await fetchModels(ws.llm_provider as ProviderType, apiKey);
    res.json({ models });
  } catch (err: any) {
    res.status(502).json({ error: "Modelle konnten nicht geladen werden: " + (err.message || "Unbekannter Fehler"), models: [] });
  }
});

export default router;
