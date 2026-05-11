CREATE TABLE IF NOT EXISTS ai_threads (
  id text PRIMARY KEY,
  user_id text NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  title text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ai_threads_user_id_idx ON ai_threads (user_id);
CREATE INDEX IF NOT EXISTS ai_threads_updated_at_idx ON ai_threads (updated_at);

CREATE TABLE IF NOT EXISTS ai_messages (
  id text PRIMARY KEY,
  thread_id text NOT NULL REFERENCES ai_threads (id) ON DELETE CASCADE,
  role text NOT NULL,
  content text NOT NULL,
  template_key text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ai_messages_thread_id_idx ON ai_messages (thread_id);
