CREATE TABLE IF NOT EXISTS "whiteboards" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL,
  "title" text NOT NULL,
  "snapshot" text NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);

DO $$ BEGIN
  ALTER TABLE "whiteboards"
    ADD CONSTRAINT "whiteboards_user_id_users_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "public"."users"("id")
    ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS "whiteboards_user_id_idx" ON "whiteboards" USING btree ("user_id");
CREATE INDEX IF NOT EXISTS "whiteboards_updated_at_idx" ON "whiteboards" USING btree ("updated_at");

INSERT INTO "whiteboards" ("id", "user_id", "title", "snapshot", "created_at", "updated_at")
SELECT
  CONCAT('legacy-', "user_id"),
  "user_id",
  'Untitled Whiteboard',
  "snapshot",
  now(),
  "updated_at"
FROM "user_whiteboards"
WHERE NOT EXISTS (
  SELECT 1
  FROM "whiteboards" w
  WHERE w."id" = CONCAT('legacy-', "user_whiteboards"."user_id")
);
