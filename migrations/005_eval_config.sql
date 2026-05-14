ALTER TABLE projects
  ADD COLUMN judge_model TEXT,
  ADD COLUMN eval_system_prompt TEXT NOT NULL DEFAULT '',
  ADD COLUMN eval_user_prompt TEXT NOT NULL DEFAULT '';
