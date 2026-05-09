CREATE TABLE IF NOT EXISTS "notes" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL,
  "title" text NOT NULL,
  "content" text DEFAULT '' NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "study_rooms" (
  "id" text PRIMARY KEY NOT NULL,
  "owner_id" text NOT NULL,
  "name" text NOT NULL,
  "description" text,
  "is_public" boolean DEFAULT false NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "flashcards" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL,
  "question" text NOT NULL,
  "answer" text NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "notes_user_id_idx" ON "notes" ("user_id");
CREATE INDEX IF NOT EXISTS "study_rooms_owner_id_idx" ON "study_rooms" ("owner_id");
CREATE INDEX IF NOT EXISTS "flashcards_user_id_idx" ON "flashcards" ("user_id");

DO $$ BEGIN
  ALTER TABLE "notes"
    ADD CONSTRAINT "notes_user_id_users_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "users"("id")
    ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "study_rooms"
    ADD CONSTRAINT "study_rooms_owner_id_users_id_fk"
    FOREIGN KEY ("owner_id") REFERENCES "users"("id")
    ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "flashcards"
    ADD CONSTRAINT "flashcards_user_id_users_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "users"("id")
    ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
