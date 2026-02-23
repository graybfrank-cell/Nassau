-- =============================================================
-- Nassau — Step 1: Drop & Create Tables + Indexes
-- Run this FIRST in Supabase SQL Editor
-- =============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================
-- DROP ALL TABLES (deepest children first, then parents)
-- =============================================================
DROP TABLE IF EXISTS expense_splits CASCADE;
DROP TABLE IF EXISTS expenses CASCADE;
DROP TABLE IF EXISTS itinerary_items CASCADE;
DROP TABLE IF EXISTS skins_games CASCADE;
DROP TABLE IF EXISTS rounds CASCADE;
DROP TABLE IF EXISTS scorecards CASCADE;
DROP TABLE IF EXISTS trip_members CASCADE;
DROP TABLE IF EXISTS trips CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS waitlist CASCADE;

-- Drop v1 Prisma tables (camelCase names)
DROP TABLE IF EXISTS "Scorecard" CASCADE;
DROP TABLE IF EXISTS "SkinsGame" CASCADE;
DROP TABLE IF EXISTS "Round" CASCADE;
DROP TABLE IF EXISTS "Expense" CASCADE;
DROP TABLE IF EXISTS "Trip" CASCADE;

-- =============================================================
-- CREATE TABLES (parents first, then children)
-- =============================================================

CREATE TABLE profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email      TEXT UNIQUE,
  full_name  TEXT DEFAULT '',
  avatar_url TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE trips (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_by     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  destination    TEXT DEFAULT '',
  start_date     TEXT DEFAULT '',
  end_date       TEXT DEFAULT '',
  arrival_time   TEXT DEFAULT '',
  departure_time TEXT DEFAULT '',
  lodging        JSONB DEFAULT '{}'::jsonb,
  invite_code    TEXT UNIQUE,
  created_at     TIMESTAMPTZ DEFAULT now(),
  updated_at     TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE trip_members (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id        UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  user_id        UUID REFERENCES profiles(id) ON DELETE SET NULL,
  name           TEXT NOT NULL DEFAULT '',
  handicap       NUMERIC DEFAULT 0,
  role           TEXT NOT NULL DEFAULT 'MEMBER'
                   CHECK (role IN ('CAPTAIN', 'MEMBER')),
  rsvp_status    TEXT NOT NULL DEFAULT 'PENDING'
                   CHECK (rsvp_status IN ('GOING', 'MAYBE', 'DECLINED', 'PENDING')),
  payment_status TEXT NOT NULL DEFAULT 'UNPAID'
                   CHECK (payment_status IN ('UNPAID', 'PAID')),
  created_at     TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE itinerary_items (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id     UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  day_number  INT,
  date        TEXT DEFAULT '',
  time        TEXT DEFAULT '',
  type        TEXT NOT NULL DEFAULT 'other'
                CHECK (type IN ('tee_time', 'dinner', 'activity', 'travel', 'other')),
  title       TEXT NOT NULL DEFAULT '',
  description TEXT DEFAULT '',
  cost        NUMERIC DEFAULT 0,
  booking_url TEXT DEFAULT '',
  notes       TEXT DEFAULT '',
  sort_order  INT DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE expenses (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id      UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  description  TEXT NOT NULL DEFAULT '',
  amount       NUMERIC NOT NULL DEFAULT 0,
  category     TEXT DEFAULT '',
  paid_by      UUID REFERENCES trip_members(id) ON DELETE SET NULL,
  split_method TEXT NOT NULL DEFAULT 'EQUAL'
                 CHECK (split_method IN ('EQUAL', 'CUSTOM', 'SPECIFIC')),
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE expense_splits (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  expense_id UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  member_id  UUID NOT NULL REFERENCES trip_members(id) ON DELETE CASCADE,
  amount     NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE rounds (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id     UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  name        TEXT NOT NULL DEFAULT '',
  course_name TEXT DEFAULT '',
  date        TEXT DEFAULT '',
  group_size  INT DEFAULT 4,
  groups      JSONB DEFAULT '[]'::jsonb,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE skins_games (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id    UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  name       TEXT NOT NULL DEFAULT '',
  buy_in     NUMERIC DEFAULT 5,
  day_number INT,
  players    JSONB DEFAULT '[]'::jsonb,
  holes      JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE scorecards (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  trip_id     UUID REFERENCES trips(id) ON DELETE CASCADE,
  course_name TEXT DEFAULT '',
  date        TEXT DEFAULT '',
  pars        JSONB DEFAULT '[]'::jsonb,
  players     JSONB DEFAULT '[]'::jsonb,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE waitlist (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email      TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================================
-- INDEXES
-- =============================================================
CREATE INDEX idx_trips_created_by ON trips(created_by);
CREATE INDEX idx_trip_members_trip_id ON trip_members(trip_id);
CREATE INDEX idx_trip_members_user_id ON trip_members(user_id);
CREATE UNIQUE INDEX idx_trip_members_unique ON trip_members(trip_id, user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_itinerary_items_trip_id ON itinerary_items(trip_id);
CREATE INDEX idx_expenses_trip_id ON expenses(trip_id);
CREATE INDEX idx_expense_splits_expense_id ON expense_splits(expense_id);
CREATE INDEX idx_expense_splits_member_id ON expense_splits(member_id);
CREATE INDEX idx_rounds_trip_id ON rounds(trip_id);
CREATE INDEX idx_skins_games_trip_id ON skins_games(trip_id);
CREATE INDEX idx_scorecards_user_id ON scorecards(user_id);
CREATE INDEX idx_scorecards_trip_id ON scorecards(trip_id);
