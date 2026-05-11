CREATE TABLE IF NOT EXISTS study_room_goals (
  id text PRIMARY KEY,
  room_id text NOT NULL REFERENCES study_rooms (id) ON DELETE CASCADE,
  user_id text NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  text text NOT NULL,
  done boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS study_room_goals_room_id_idx ON study_room_goals (room_id);

ALTER TABLE study_rooms ADD COLUMN IF NOT EXISTS timer_phase text;
ALTER TABLE study_rooms ADD COLUMN IF NOT EXISTS timer_duration_sec integer;
ALTER TABLE study_rooms ADD COLUMN IF NOT EXISTS timer_remaining_sec integer;
ALTER TABLE study_rooms ADD COLUMN IF NOT EXISTS timer_running boolean NOT NULL DEFAULT false;
ALTER TABLE study_rooms ADD COLUMN IF NOT EXISTS timer_anchor_ends_at timestamptz;
ALTER TABLE study_rooms ADD COLUMN IF NOT EXISTS timer_leader_user_id text;
