import { Router } from "express";
import { query } from "../db.js";

const router = Router();

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
  const { rows } = await query(
    `INSERT INTO eval_runs (project_id, model_tag, system_prompt, user_input)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [req.params.id, model_tag, system_prompt || "", user_input || ""]
  );
  res.status(201).json(rows[0]);
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
