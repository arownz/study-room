-- Store note inline images in PostgreSQL (no local disk) for portable deployments.

CREATE TABLE IF NOT EXISTS note_image_assets (
  id text PRIMARY KEY,
  user_id text NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  mime_type text NOT NULL,
  data bytea NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS note_image_assets_user_id_idx ON note_image_assets (user_id);
