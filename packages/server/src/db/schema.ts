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
-- Why a lesson was cancelled and by whom, shown to the other side.
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancelled_by text, ADD COLUMN IF NOT EXISTS cancel_reason text, ADD COLUMN IF NOT EXISTS cancel_note text;
-- Self-study courses: best result per lesson. Course content lives in @kidsland/shared.
CREATE TABLE IF NOT EXISTS course_progress (
  child_id     uuid NOT NULL REFERENCES child_profiles(id) ON DELETE CASCADE,
  course_id    text NOT NULL,
  lesson_id    text NOT NULL,
  best_score   integer NOT NULL DEFAULT 0,
  max_score    integer NOT NULL,
  attempts     integer NOT NULL DEFAULT 0,
  completed_at timestamptz,
  updated_at   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (child_id, lesson_id)
);

-- Per-question results (best ever) and whether the first-pass reward was paid. Lessons can now be
-- completed by reading the theory, so completion and reward are tracked separately.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'course_progress' AND column_name = 'rewarded') THEN
    ALTER TABLE course_progress ADD COLUMN results jsonb NOT NULL DEFAULT '{}', ADD COLUMN rewarded boolean NOT NULL DEFAULT false;
    UPDATE course_progress SET rewarded = true WHERE completed_at IS NOT NULL;
  END IF;
END $$;

-- One support conversation per user.
CREATE TABLE IF NOT EXISTS support_threads (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  status       text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  user_unread  boolean NOT NULL DEFAULT false,
  staff_unread boolean NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS support_messages (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id  uuid NOT NULL REFERENCES support_threads(id) ON DELETE CASCADE,
  author_id  uuid REFERENCES users(id) ON DELETE SET NULL,
  is_staff   boolean NOT NULL DEFAULT false,
  body       text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS support_messages_thread_idx ON support_messages(thread_id, created_at);

-- Lesson room: chat and a shared whiteboard per booking.
CREATE TABLE IF NOT EXISTS lesson_messages (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  author_id  uuid REFERENCES users(id) ON DELETE SET NULL,
  is_tutor   boolean NOT NULL,
  body       text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS lesson_messages_booking_idx ON lesson_messages(booking_id, created_at);
CREATE TABLE IF NOT EXISTS lesson_boards (
  booking_id uuid PRIMARY KEY REFERENCES bookings(id) ON DELETE CASCADE,
  strokes    jsonb NOT NULL DEFAULT '[]',
  version    integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Messages blocked by the child-safety filter, for moderators.
CREATE TABLE IF NOT EXISTS safety_flags (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid REFERENCES users(id) ON DELETE CASCADE,
  context    text NOT NULL,
  body       text NOT NULL,
  reason     text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- "Be an admin" posts: anyone signed in writes one, a real admin approves it before it is shown.
CREATE TABLE IF NOT EXISTS community_posts (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id   uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  author_name text NOT NULL,
  title       text NOT NULL,
  body        text NOT NULL,
  status      text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  review_note text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz
);
CREATE INDEX IF NOT EXISTS community_posts_status_idx ON community_posts(status, created_at DESC);

-- Kazakh was dropped from lesson languages in favour of Greek and Hebrew.
UPDATE tutor_profiles
   SET languages = CASE WHEN array_length(array_remove(languages, 'kk'), 1) IS NULL THEN ARRAY['ru'] ELSE array_remove(languages, 'kk') END
 WHERE 'kk' = ANY(languages);

-- Personal growth has articles only: its topics are no longer taught by tutors.
UPDATE tutor_profiles
   SET subjects = (SELECT coalesce(array_agg(x), '{}') FROM unnest(subjects) x
                    WHERE x NOT IN ('emotions', 'kindness', 'mindfulness', 'gratitude', 'values', 'stories'))
 WHERE subjects && ARRAY['emotions', 'kindness', 'mindfulness', 'gratitude', 'values', 'stories'];
UPDATE tutor_profiles SET is_published = false WHERE cardinality(subjects) = 0 AND is_published;
`;
