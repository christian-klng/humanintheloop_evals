import fs from "fs";
import path from "path";
import { query } from "./db.js";

export async function runMigrations() {
  await query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      name TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);

  const migrationsDir = path.resolve(
    process.env.NODE_ENV === "production" ? "migrations" : "migrations"
  );
  const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith(".sql")).sort();

  for (const file of files) {
    const { rows } = await query("SELECT 1 FROM _migrations WHERE name = $1", [file]);
    if (rows.length > 0) continue;

    const sql = fs.readFileSync(path.join(migrationsDir, file), "utf-8");
    console.log(`Running migration: ${file}`);
    await query("BEGIN");
    try {
      await query(sql);
      await query("INSERT INTO _migrations (name) VALUES ($1)", [file]);
      await query("COMMIT");
      console.log(`  Applied: ${file}`);
    } catch (err) {
      await query("ROLLBACK");
      console.error(`  Failed: ${file}`, err);
      throw err;
    }
  }
}
