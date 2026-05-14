-- Store uploaded profile avatars in PostgreSQL (no disk uploads folder).

ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_data bytea;
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_mime text;
