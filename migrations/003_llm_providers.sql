ALTER TABLE workspaces
  ADD COLUMN llm_provider      TEXT CHECK (llm_provider IN ('openrouter', 'cortecs')),
  ADD COLUMN llm_api_key_enc   TEXT,
  ADD COLUMN llm_api_key_iv    TEXT,
  ADD COLUMN llm_api_key_tag   TEXT,
  ADD COLUMN llm_configured_at TIMESTAMPTZ;

ALTER TABLE projects
  ADD COLUMN default_model TEXT;
