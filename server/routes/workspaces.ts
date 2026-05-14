import { Router } from "express";
import { query } from "../db.js";
import crypto from "crypto";

const router = Router();

function generateInviteCode(): string {
  return crypto.randomInt(100000, 999999).toString();
}

router.get("/workspaces", async (req, res) => {
  const { rows } = await query(
    `SELECT w.id, w.name, w.invite_code, w.created_at, wm.role,
            (SELECT COUNT(*) FROM workspace_members WHERE workspace_id = w.id) AS member_count
     FROM workspaces w
     JOIN workspace_members wm ON wm.workspace_id = w.id AND wm.user_id = $1
     ORDER BY w.name`,
    [req.userId]
  );
  res.json(rows);
});

router.post("/workspaces", async (req, res) => {
  const { name } = req.body;
  if (!name || typeof name !== "string") {
    res.status(400).json({ error: "Name is required" });
    return;
  }

  let inviteCode = generateInviteCode();
  let attempts = 0;
  while (attempts < 10) {
    const { rows: existing } = await query(
      "SELECT 1 FROM workspaces WHERE invite_code = $1",
      [inviteCode]
    );
    if (existing.length === 0) break;
    inviteCode = generateInviteCode();
    attempts++;
  }

  const { rows } = await query(
    "INSERT INTO workspaces (name, invite_code, created_by) VALUES ($1, $2, $3) RETURNING *",
    [name.trim(), inviteCode, req.userId]
  );
  const workspace = rows[0];

  await query(
    "INSERT INTO workspace_members (workspace_id, user_id, role) VALUES ($1, $2, 'owner')",
    [workspace.id, req.userId]
  );

  res.status(201).json(workspace);
});

router.post("/workspaces/join", async (req, res) => {
  const { code } = req.body;
  if (!code || typeof code !== "string") {
    res.status(400).json({ error: "Code is required" });
    return;
  }

  const { rows: workspaces } = await query(
    "SELECT * FROM workspaces WHERE invite_code = $1",
    [code.trim()]
  );
  if (workspaces.length === 0) {
    res.status(404).json({ error: "Arbeitsbereich nicht gefunden" });
    return;
  }

  const workspace = workspaces[0];

  const { rows: existing } = await query(
    "SELECT 1 FROM workspace_members WHERE workspace_id = $1 AND user_id = $2",
    [workspace.id, req.userId]
  );
  if (existing.length > 0) {
    res.json(workspace);
    return;
  }

  await query(
    "INSERT INTO workspace_members (workspace_id, user_id, role) VALUES ($1, $2, 'member')",
    [workspace.id, req.userId]
  );

  res.status(201).json(workspace);
});

router.patch("/workspaces/:id", async (req, res) => {
  const { name } = req.body;
  if (!name || typeof name !== "string" || !name.trim()) {
    res.status(400).json({ error: "Name ist erforderlich" });
    return;
  }
  const { rows: membership } = await query(
    "SELECT 1 FROM workspace_members WHERE workspace_id = $1 AND user_id = $2",
    [req.params.id, req.userId]
  );
  if (membership.length === 0) {
    res.status(404).json({ error: "Arbeitsbereich nicht gefunden" });
    return;
  }
  const { rows } = await query(
    "UPDATE workspaces SET name = $1 WHERE id = $2 RETURNING id, name",
    [name.trim(), req.params.id]
  );
  res.json(rows[0]);
});

router.get("/workspaces/:id", async (req, res) => {
  const { rows: membership } = await query(
    "SELECT 1 FROM workspace_members WHERE workspace_id = $1 AND user_id = $2",
    [req.params.id, req.userId]
  );
  if (membership.length === 0) {
    res.status(404).json({ error: "Workspace not found" });
    return;
  }

  const { rows } = await query(
    `SELECT w.*,
            json_agg(json_build_object('id', u.id, 'email', u.email, 'role', wm.role, 'joined_at', wm.joined_at) ORDER BY wm.joined_at) AS members
     FROM workspaces w
     JOIN workspace_members wm ON wm.workspace_id = w.id
     JOIN users u ON u.id = wm.user_id
     WHERE w.id = $1
     GROUP BY w.id`,
    [req.params.id]
  );
  res.json(rows[0]);
});

export default router;
