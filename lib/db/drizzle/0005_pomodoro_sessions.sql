CREATE TABLE IF NOT EXISTS pomodoro_sessions (
  id text PRIMARY KEY,
  user_id text NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  mode text NOT NULL,
  duration_planned_sec integer NOT NULL,
  duration_actual_sec integer NOT NULL,
  label text,
  started_at timestamptz NOT NULL,
  completed_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS pomodoro_sessions_user_id_idx ON pomodoro_sessions (user_id);
CREATE INDEX IF NOT EXISTS pomodoro_sessions_completed_at_idx ON pomodoro_sessions (completed_at);
