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
`;
