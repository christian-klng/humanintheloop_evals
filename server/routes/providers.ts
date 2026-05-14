import { Router, Request, Response } from "express";
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

function getProviderResponse(row: any) {
  if (!row.llm_provider) {
    return { provider: null };
  }
  try {
    const apiKey = decrypt(row.llm_api_key_enc, row.llm_api_key_iv, row.llm_api_key_tag);
    return {
      provider: row.llm_provider,
      api_key_masked: maskApiKey(apiKey),
      configured_at: row.llm_configured_at,
    };
  } catch {
    return {
      provider: row.llm_provider,
      api_key_masked: "••••••••????",
      configured_at: row.llm_configured_at,
      error: "Schlüssel konnte nicht entschlüsselt werden",
    };
  }
}

async function handleGetProvider(table: string, idColumn: string, id: string, res: Response) {
  const { rows } = await query(
    `SELECT llm_provider, llm_api_key_enc, llm_api_key_iv, llm_api_key_tag, llm_configured_at FROM ${table} WHERE ${idColumn} = $1`,
    [id]
  );
  if (rows.length === 0) {
    res.status(404).json({ error: "Nicht gefunden" });
    return;
  }
  res.json(getProviderResponse(rows[0]));
}

async function handlePutProvider(table: string, idColumn: string, id: string, req: Request, res: Response) {
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
    `UPDATE ${table}
     SET llm_provider = $1, llm_api_key_enc = $2, llm_api_key_iv = $3,
         llm_api_key_tag = $4, llm_configured_at = now()
     WHERE ${idColumn} = $5
     RETURNING llm_provider, llm_configured_at`,
    [provider, ciphertext, iv, tag, id]
  );

  res.json({
    provider: rows[0].llm_provider,
    api_key_masked: maskApiKey(api_key.trim()),
    configured_at: rows[0].llm_configured_at,
  });
}

async function handleDeleteProvider(table: string, idColumn: string, id: string, res: Response) {
  await query(
    `UPDATE ${table}
     SET llm_provider = NULL, llm_api_key_enc = NULL, llm_api_key_iv = NULL,
         llm_api_key_tag = NULL, llm_configured_at = NULL
     WHERE ${idColumn} = $1`,
    [id]
  );
  res.json({ ok: true });
}

async function handleTestProvider(table: string, idColumn: string, id: string, res: Response) {
  const { rows } = await query(
    `SELECT llm_provider, llm_api_key_enc, llm_api_key_iv, llm_api_key_tag FROM ${table} WHERE ${idColumn} = $1`,
    [id]
  );
  if (rows.length === 0 || !rows[0].llm_provider) {
    res.status(400).json({ ok: false, error: "Kein Anbieter konfiguriert" });
    return;
  }
  const apiKey = decrypt(rows[0].llm_api_key_enc, rows[0].llm_api_key_iv, rows[0].llm_api_key_tag);
  const ok = await testConnection(rows[0].llm_provider as ProviderType, apiKey);
  res.json({ ok, error: ok ? undefined : "Verbindung fehlgeschlagen" });
}

async function handleGetModels(table: string, idColumn: string, id: string, res: Response) {
  const { rows } = await query(
    `SELECT llm_provider, llm_api_key_enc, llm_api_key_iv, llm_api_key_tag FROM ${table} WHERE ${idColumn} = $1`,
    [id]
  );
  if (rows.length === 0 || !rows[0].llm_provider) {
    res.json({ models: [] });
    return;
  }
  const apiKey = decrypt(rows[0].llm_api_key_enc, rows[0].llm_api_key_iv, rows[0].llm_api_key_tag);
  const models = await fetchModels(rows[0].llm_provider as ProviderType, apiKey);
  res.json({ models });
}

// --- Workspace provider routes ---

router.get("/workspaces/:id/provider", async (req, res) => {
  try {
    if (!(await isWorkspaceMember(req.params.id, req.userId!))) {
      res.status(404).json({ error: "Arbeitsbereich nicht gefunden" });
      return;
    }
    await handleGetProvider("workspaces", "id", req.params.id, res);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Interner Fehler" });
  }
});

router.put("/workspaces/:id/provider", async (req, res) => {
  try {
    if (!(await isWorkspaceMember(req.params.id, req.userId!))) {
      res.status(404).json({ error: "Arbeitsbereich nicht gefunden" });
      return;
    }
    await handlePutProvider("workspaces", "id", req.params.id, req, res);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Interner Fehler" });
  }
});

router.delete("/workspaces/:id/provider", async (req, res) => {
  try {
    if (!(await isWorkspaceMember(req.params.id, req.userId!))) {
      res.status(404).json({ error: "Arbeitsbereich nicht gefunden" });
      return;
    }
    await handleDeleteProvider("workspaces", "id", req.params.id, res);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Interner Fehler" });
  }
});

router.post("/workspaces/:id/provider/test", async (req, res) => {
  try {
    if (!(await isWorkspaceMember(req.params.id, req.userId!))) {
      res.status(404).json({ error: "Arbeitsbereich nicht gefunden" });
      return;
    }
    await handleTestProvider("workspaces", "id", req.params.id, res);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Interner Fehler" });
  }
});

router.get("/workspaces/:id/provider/models", async (req, res) => {
  try {
    if (!(await isWorkspaceMember(req.params.id, req.userId!))) {
      res.status(404).json({ error: "Arbeitsbereich nicht gefunden" });
      return;
    }
    await handleGetModels("workspaces", "id", req.params.id, res);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Interner Fehler", models: [] });
  }
});

// --- Personal (user-level) provider routes ---

router.get("/me/provider", async (req, res) => {
  try {
    await handleGetProvider("users", "id", req.userId!, res);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Interner Fehler" });
  }
});

router.put("/me/provider", async (req, res) => {
  try {
    await handlePutProvider("users", "id", req.userId!, req, res);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Interner Fehler" });
  }
});

router.delete("/me/provider", async (req, res) => {
  try {
    await handleDeleteProvider("users", "id", req.userId!, res);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Interner Fehler" });
  }
});

router.post("/me/provider/test", async (req, res) => {
  try {
    await handleTestProvider("users", "id", req.userId!, res);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Interner Fehler" });
  }
});

router.get("/me/provider/models", async (req, res) => {
  try {
    await handleGetModels("users", "id", req.userId!, res);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Interner Fehler", models: [] });
  }
});

export default router;
