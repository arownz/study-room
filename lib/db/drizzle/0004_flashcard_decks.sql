-- Flashcard decks: group cards per user; all cards require a deck.

CREATE TABLE IF NOT EXISTS flashcard_decks (
  id text PRIMARY KEY,
  user_id text NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS flashcard_decks_user_id_idx ON flashcard_decks (user_id);

ALTER TABLE flashcards ADD COLUMN IF NOT EXISTS deck_id text;

-- Backfill decks and card links before NOT NULL + FK.
INSERT INTO flashcard_decks (id, user_id, title, description, created_at, updated_at)
SELECT gen_random_uuid()::text, f.user_id, 'General', NULL, now(), now()
FROM (SELECT DISTINCT user_id FROM flashcards WHERE deck_id IS NULL) AS f
WHERE NOT EXISTS (
  SELECT 1 FROM flashcard_decks d WHERE d.user_id = f.user_id
);

UPDATE flashcards c
SET deck_id = d.id
FROM flashcard_decks d
WHERE c.user_id = d.user_id
  AND c.deck_id IS NULL
  AND d.title = 'General';

UPDATE flashcards c
SET deck_id = (
  SELECT d.id FROM flashcard_decks d WHERE d.user_id = c.user_id ORDER BY d.created_at ASC LIMIT 1
)
WHERE c.deck_id IS NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'flashcards_deck_id_fkey'
  ) THEN
    ALTER TABLE flashcards
      ADD CONSTRAINT flashcards_deck_id_fkey
      FOREIGN KEY (deck_id) REFERENCES flashcard_decks (id) ON DELETE CASCADE;
  END IF;
END $$;

ALTER TABLE flashcards ALTER COLUMN deck_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS flashcards_deck_id_idx ON flashcards (deck_id);
