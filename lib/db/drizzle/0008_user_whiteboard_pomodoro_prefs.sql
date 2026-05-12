CREATE TABLE IF NOT EXISTS user_whiteboards (
  user_id text PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
  snapshot text NOT NULL DEFAULT '[]',
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_pomodoro_preferences (
  user_id text PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
  focus_sec integer NOT NULL,
  short_break_sec integer NOT NULL,
  long_break_sec integer NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
