import { Router } from "express";
import { query } from "../db.js";
import { signToken } from "../lib/jwt.js";
import { sendMagicLinkEmail } from "../lib/email.js";

const router = Router();

router.post("/send-link", async (req, res) => {
  const { email } = req.body;
  if (!email || typeof email !== "string") {
    res.status(400).json({ error: "Email is required" });
    return;
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Upsert user
  let { rows } = await query(
    `INSERT INTO users (email) VALUES ($1)
     ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email
     RETURNING id`,
    [normalizedEmail]
  );
  const userId = rows[0].id;

  // Create magic link
  const { rows: linkRows } = await query(
    `INSERT INTO magic_links (user_id) VALUES ($1) RETURNING token`,
    [userId]
  );
  const token = linkRows[0].token;

  try {
    await sendMagicLinkEmail(normalizedEmail, token);
  } catch (err) {
    console.error("Failed to send magic link email:", err);
  }

  // Always return success to prevent email enumeration
  res.json({ ok: true });
});

router.get("/verify", async (req, res) => {
  const { token } = req.query;
  if (!token || typeof token !== "string") {
    res.status(400).json({ error: "Token is required" });
    return;
  }

  const { rows } = await query(
    `UPDATE magic_links
     SET used_at = now()
     WHERE token = $1 AND used_at IS NULL AND expires_at > now()
     RETURNING user_id`,
    [token]
  );

  if (rows.length === 0) {
    res.status(400).json({ error: "Invalid or expired token" });
    return;
  }

  const jwt = signToken(rows[0].user_id);
  const isProduction = process.env.NODE_ENV === "production";

  res.cookie("token", jwt, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
  });

  res.redirect("/dashboard");
});

router.post("/logout", (_req, res) => {
  res.clearCookie("token", { path: "/" });
  res.json({ ok: true });
});

export default router;
