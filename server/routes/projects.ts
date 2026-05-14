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

router.get("/me", async (req, res) => {
  const { rows } = await query("SELECT id, email, created_at FROM users WHERE id = $1", [req.userId]);
  if (rows.length === 0) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json(rows[0]);
});

router.get("/projects", async (req, res) => {
  const workspaceId = req.query.workspace_id as string | undefined;

  let sql: string;
  let params: unknown[];

  if (workspaceId) {
    sql = `SELECT
             p.id, p.name, p.status, p.created_at, p.updated_at, p.workspace_id,
             string_agg(DISTINCT er.model_tag, ', ') AS models,
             MAX(er.created_at) AS last_run
           FROM projects p
           LEFT JOIN eval_runs er ON er.project_id = p.id
           JOIN workspace_members wm ON wm.workspace_id = p.workspace_id AND wm.user_id = $1
           WHERE p.workspace_id = $2
           GROUP BY p.id
           ORDER BY p.updated_at DESC`;
    params = [req.userId, workspaceId];
  } else {
    sql = `SELECT
             p.id, p.name, p.status, p.created_at, p.updated_at, p.workspace_id,
             string_agg(DISTINCT er.model_tag, ', ') AS models,
             MAX(er.created_at) AS last_run
           FROM projects p
           LEFT JOIN eval_runs er ON er.project_id = p.id
           WHERE p.user_id = $1 AND p.workspace_id IS NULL
           GROUP BY p.id
           ORDER BY p.updated_at DESC`;
    params = [req.userId];
  }

  const { rows } = await query(sql, params);
  res.json(rows);
});

router.post("/projects", async (req, res) => {
  const { name, workspace_id } = req.body;
  if (!name || typeof name !== "string") {
    res.status(400).json({ error: "Name is required" });
    return;
  }

  if (workspace_id) {
    const { rows: membership } = await query(
      "SELECT 1 FROM workspace_members WHERE workspace_id = $1 AND user_id = $2",
      [workspace_id, req.userId]
    );
    if (membership.length === 0) {
      res.status(403).json({ error: "Not a member of this workspace" });
      return;
    }
  }

  const { rows } = await query(
    "INSERT INTO projects (user_id, name, workspace_id) VALUES ($1, $2, $3) RETURNING *",
    [req.userId, name.trim(), workspace_id || null]
  );
  res.status(201).json(rows[0]);
});

router.get("/projects/:id", async (req, res) => {
  if (!(await canAccessProject(req.params.id, req.userId!))) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  const { rows } = await query("SELECT * FROM projects WHERE id = $1", [req.params.id]);
  res.json(rows[0]);
});

router.patch("/projects/:id", async (req, res) => {
  if (!(await canAccessProject(req.params.id, req.userId!))) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  const { name, status } = req.body;
  const { rows } = await query(
    `UPDATE projects
     SET name = COALESCE($1, name),
         status = COALESCE($2, status),
         updated_at = now()
     WHERE id = $3
     RETURNING *`,
    [name, status, req.params.id]
  );
  if (rows.length === 0) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  res.json(rows[0]);
});

router.patch("/projects/:id/default-model", async (req, res) => {
  if (!(await canAccessProject(req.params.id, req.userId!))) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  const { default_model } = req.body;
  const { rows } = await query(
    "UPDATE projects SET default_model = $1, updated_at = now() WHERE id = $2 RETURNING *",
    [default_model || null, req.params.id]
  );
  res.json(rows[0]);
});

router.patch("/projects/:id/eval-config", async (req, res) => {
  if (!(await canAccessProject(req.params.id, req.userId!))) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  const { judge_model, eval_system_prompt, eval_user_prompt } = req.body;
  const { rows } = await query(
    `UPDATE projects
     SET judge_model = $1,
         eval_system_prompt = COALESCE($2, ''),
         eval_user_prompt = COALESCE($3, ''),
         updated_at = now()
     WHERE id = $4
     RETURNING *`,
    [judge_model || null, eval_system_prompt, eval_user_prompt, req.params.id]
  );
  res.json(rows[0]);
});

router.delete("/projects/:id", async (req, res) => {
  if (!(await canAccessProject(req.params.id, req.userId!))) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  const { rowCount } = await query("DELETE FROM projects WHERE id = $1", [req.params.id]);
  if (rowCount === 0) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  res.json({ ok: true });
});

export default router;
