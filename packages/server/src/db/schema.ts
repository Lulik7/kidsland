export const SCHEMA_SQL = /* sql */ `
CREATE TABLE IF NOT EXISTS users (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email         text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  role          text NOT NULL DEFAULT 'parent' CHECK (role IN ('parent', 'tutor', 'admin')),
  phone         text,
  is_premium    boolean NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS child_profiles (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id  uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  nickname   text NOT NULL,
  avatar_url text,
  coins      integer NOT NULL DEFAULT 0,
  xp         integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS child_profiles_parent_idx ON child_profiles(parent_id);

CREATE TABLE IF NOT EXISTS levels (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        text NOT NULL UNIQUE,
  title       text NOT NULL,
  description text NOT NULL DEFAULT '',
  theme       text NOT NULL CHECK (theme IN ('space', 'ocean', 'robot')),
  order_index integer NOT NULL,
  config_json jsonb NOT NULL,
  is_premium  boolean NOT NULL DEFAULT false,
  xp_reward   integer NOT NULL DEFAULT 10
);

CREATE TABLE IF NOT EXISTS game_progress (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id     uuid NOT NULL REFERENCES child_profiles(id) ON DELETE CASCADE,
  level_id     uuid NOT NULL REFERENCES levels(id) ON DELETE CASCADE,
  stars        integer NOT NULL DEFAULT 0 CHECK (stars BETWEEN 0 AND 3),
  score        integer NOT NULL DEFAULT 0,
  attempts     integer NOT NULL DEFAULT 0,
  code_snippet jsonb,
  completed_at timestamptz,
  updated_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (child_id, level_id)
);

CREATE TABLE IF NOT EXISTS tutor_profiles (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  display_name  text NOT NULL,
  headline      text NOT NULL DEFAULT '',
  bio           text NOT NULL DEFAULT '',
  video_url     text,
  avatar        text,
  subjects      text[] NOT NULL DEFAULT '{}',
  languages     text[] NOT NULL DEFAULT '{ru}',
  age_min       integer NOT NULL DEFAULT 6,
  age_max       integer NOT NULL DEFAULT 12,
  hourly_rate   integer NOT NULL DEFAULT 1500,
  rating        numeric(2, 1) NOT NULL DEFAULT 5.0,
  reviews_count integer NOT NULL DEFAULT 0,
  is_published  boolean NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tutor_slots (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id     uuid NOT NULL REFERENCES tutor_profiles(id) ON DELETE CASCADE,
  starts_at    timestamptz NOT NULL,
  duration_min integer NOT NULL DEFAULT 45,
  UNIQUE (tutor_id, starts_at)
);

CREATE TABLE IF NOT EXISTS bookings (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  child_id     uuid NOT NULL REFERENCES child_profiles(id) ON DELETE CASCADE,
  tutor_id     uuid NOT NULL REFERENCES tutor_profiles(id) ON DELETE CASCADE,
  slot_id      uuid NOT NULL REFERENCES tutor_slots(id) ON DELETE CASCADE,
  slot_time    timestamptz NOT NULL,
  status       text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  is_trial     boolean NOT NULL DEFAULT false,
  price        integer NOT NULL DEFAULT 0,
  meeting_link text NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);
-- A slot can hold only one live booking; cancelled ones free it up again.
CREATE UNIQUE INDEX IF NOT EXISTS bookings_active_slot_idx ON bookings(slot_id) WHERE status <> 'cancelled';
CREATE INDEX IF NOT EXISTS bookings_parent_idx ON bookings(parent_id);
CREATE INDEX IF NOT EXISTS bookings_tutor_idx ON bookings(tutor_id);
`;
