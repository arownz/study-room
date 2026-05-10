-- Adds the `role_selected` flag so the application can force first-time
-- users through the role-selection onboarding screen instead of silently
-- accepting the database default ("student").

ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "role_selected" boolean NOT NULL DEFAULT false;
