import { Router } from "express";
import { query } from "../db.js";

const router = Router();

router.get("/me", async (req, res) => {
  const { rows } = await query("SELECT id, email, created_at FROM users WHERE id = $1", [req.userId]);
  if (rows.length === 0) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json(rows[0]);
});

router.get("/projects", async (req, res) => {
  const { rows } = await query(
    `SELECT
       p.id, p.name, p.status, p.created_at, p.updated_at,
       string_agg(DISTINCT er.model_tag, ', ') AS models,
       MAX(er.created_at) AS last_run
     FROM projects p
     LEFT JOIN eval_runs er ON er.project_id = p.id
     WHERE p.user_id = $1
     GROUP BY p.id
     ORDER BY p.updated_at DESC`,
    [req.userId]
  );
  res.json(rows);
});

router.post("/projects", async (req, res) => {
  const { name } = req.body;
  if (!name || typeof name !== "string") {
    res.status(400).json({ error: "Name is required" });
    return;
  }
  const { rows } = await query(
    "INSERT INTO projects (user_id, name) VALUES ($1, $2) RETURNING *",
    [req.userId, name.trim()]
  );
  res.status(201).json(rows[0]);
});

router.get("/projects/:id", async (req, res) => {
  const { rows } = await query(
    "SELECT * FROM projects WHERE id = $1 AND user_id = $2",
    [req.params.id, req.userId]
  );
  if (rows.length === 0) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  res.json(rows[0]);
});

router.patch("/projects/:id", async (req, res) => {
  const { name, status } = req.body;
  const { rows } = await query(
    `UPDATE projects
     SET name = COALESCE($1, name),
         status = COALESCE($2, status),
         updated_at = now()
     WHERE id = $3 AND user_id = $4
     RETURNING *`,
    [name, status, req.params.id, req.userId]
  );
  if (rows.length === 0) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  res.json(rows[0]);
});

router.delete("/projects/:id", async (req, res) => {
  const { rowCount } = await query(
    "DELETE FROM projects WHERE id = $1 AND user_id = $2",
    [req.params.id, req.userId]
  );
  if (rowCount === 0) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  res.json({ ok: true });
});

export default router;
