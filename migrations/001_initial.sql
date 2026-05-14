CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE users (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email      TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE magic_links (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token      TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT now() + INTERVAL '15 minutes',
  used_at    TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_magic_links_token ON magic_links(token);

CREATE TABLE projects (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  status     TEXT NOT NULL DEFAULT 'Healthy' CHECK (status IN ('Healthy', 'Review needed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_projects_user ON projects(user_id);

CREATE TABLE criteria (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  weight      INTEGER NOT NULL CHECK (weight > 0 AND weight <= 100),
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_criteria_project ON criteria(project_id);

CREATE TABLE eval_runs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  model_tag     TEXT NOT NULL,
  system_prompt TEXT NOT NULL DEFAULT '',
  user_input    TEXT NOT NULL DEFAULT '',
  output_text   TEXT,
  latency_ms    INTEGER,
  overall_score NUMERIC(5,2),
  summary_text  TEXT,
  status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','running','completed','failed')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_eval_runs_project ON eval_runs(project_id);

CREATE TABLE eval_scores (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  eval_run_id  UUID NOT NULL REFERENCES eval_runs(id) ON DELETE CASCADE,
  criteria_id  UUID NOT NULL REFERENCES criteria(id) ON DELETE CASCADE,
  score        NUMERIC(3,2) NOT NULL CHECK (score >= 0 AND score <= 1),
  note         TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(eval_run_id, criteria_id)
);
CREATE INDEX idx_eval_scores_run ON eval_scores(eval_run_id);
