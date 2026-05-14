import { Router } from "express";
import { query } from "../db.js";

const router = Router();

async function verifyProjectOwner(projectId: string, userId: string): Promise<boolean> {
  const { rows } = await query(
    "SELECT 1 FROM projects WHERE id = $1 AND user_id = $2",
    [projectId, userId]
  );
  return rows.length > 0;
}

router.get("/projects/:id/criteria", async (req, res) => {
  if (!(await verifyProjectOwner(req.params.id, req.userId!))) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  const { rows } = await query(
    "SELECT * FROM criteria WHERE project_id = $1 ORDER BY sort_order, created_at",
    [req.params.id]
  );
  res.json(rows);
});

router.post("/projects/:id/criteria", async (req, res) => {
  if (!(await verifyProjectOwner(req.params.id, req.userId!))) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  const { title, description, weight } = req.body;
  if (!title || typeof weight !== "number") {
    res.status(400).json({ error: "Title and weight are required" });
    return;
  }
  const { rows } = await query(
    `INSERT INTO criteria (project_id, title, description, weight)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [req.params.id, title, description || "", weight]
  );
  res.status(201).json(rows[0]);
});

router.patch("/projects/:id/criteria/:cid", async (req, res) => {
  if (!(await verifyProjectOwner(req.params.id, req.userId!))) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  const { title, description, weight } = req.body;
  const { rows } = await query(
    `UPDATE criteria
     SET title = COALESCE($1, title),
         description = COALESCE($2, description),
         weight = COALESCE($3, weight)
     WHERE id = $4 AND project_id = $5
     RETURNING *`,
    [title, description, weight, req.params.cid, req.params.id]
  );
  if (rows.length === 0) {
    res.status(404).json({ error: "Criterion not found" });
    return;
  }
  res.json(rows[0]);
});

router.delete("/projects/:id/criteria/:cid", async (req, res) => {
  if (!(await verifyProjectOwner(req.params.id, req.userId!))) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  const { rowCount } = await query(
    "DELETE FROM criteria WHERE id = $1 AND project_id = $2",
    [req.params.cid, req.params.id]
  );
  if (rowCount === 0) {
    res.status(404).json({ error: "Criterion not found" });
    return;
  }
  res.json({ ok: true });
});

export default router;
