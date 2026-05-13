-- User-facing notification toggles (JSON string; merged with defaults in application code).
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "notification_preferences" text NOT NULL DEFAULT '{}';
