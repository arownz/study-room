CREATE TABLE IF NOT EXISTS "note_folders" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL,
  "name" text NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  "deleted_at" timestamptz,
  CONSTRAINT "note_folders_user_name_unique" UNIQUE ("user_id", "name")
);

CREATE TABLE IF NOT EXISTS "note_collaborators" (
  "id" text PRIMARY KEY NOT NULL,
  "note_id" text NOT NULL,
  "user_id" text NOT NULL,
  "permission" text DEFAULT 'viewer' NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT "note_collaborators_note_user_unique" UNIQUE ("note_id", "user_id")
);

ALTER TABLE "notes" ADD COLUMN IF NOT EXISTS "folder_id" text;
ALTER TABLE "notes" ADD COLUMN IF NOT EXISTS "deleted_at" timestamptz;
ALTER TABLE "notes" ADD COLUMN IF NOT EXISTS "deleted_by" text;

CREATE INDEX IF NOT EXISTS "notes_folder_id_idx" ON "notes" ("folder_id");
CREATE INDEX IF NOT EXISTS "notes_deleted_at_idx" ON "notes" ("deleted_at");
CREATE INDEX IF NOT EXISTS "note_folders_user_id_idx" ON "note_folders" ("user_id");
CREATE INDEX IF NOT EXISTS "note_collaborators_note_id_idx" ON "note_collaborators" ("note_id");
CREATE INDEX IF NOT EXISTS "note_collaborators_user_id_idx" ON "note_collaborators" ("user_id");

DO $$ BEGIN
  ALTER TABLE "note_folders"
    ADD CONSTRAINT "note_folders_user_id_users_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "users"("id")
    ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "notes"
    ADD CONSTRAINT "notes_folder_id_note_folders_id_fk"
    FOREIGN KEY ("folder_id") REFERENCES "note_folders"("id")
    ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "notes"
    ADD CONSTRAINT "notes_deleted_by_users_id_fk"
    FOREIGN KEY ("deleted_by") REFERENCES "users"("id")
    ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "note_collaborators"
    ADD CONSTRAINT "note_collaborators_note_id_notes_id_fk"
    FOREIGN KEY ("note_id") REFERENCES "notes"("id")
    ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "note_collaborators"
    ADD CONSTRAINT "note_collaborators_user_id_users_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "users"("id")
    ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
