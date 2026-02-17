-- =============================================================
-- Nassau (nassau.golf) — Supabase Schema v2
-- Complete database schema for the golf trip planning app
-- =============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================
-- Drop existing tables (v1 Prisma tables used camelCase)
-- =============================================================
DROP TABLE IF EXISTS "Scorecard" CASCADE;
DROP TABLE IF EXISTS "SkinsGame" CASCADE;
DROP TABLE IF EXISTS "Round" CASCADE;
DROP TABLE IF EXISTS "Expense" CASCADE;
DROP TABLE IF EXISTS "Trip" CASCADE;

-- Drop v2 tables if re-running
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

-- =============================================================
-- 1. PROFILES — synced with Supabase Auth
-- =============================================================
CREATE TABLE profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email      TEXT UNIQUE,
  full_name  TEXT DEFAULT '',
  avatar_url TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read profiles
CREATE POLICY "Profiles are viewable by authenticated users"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

-- Users can update only their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Users can insert their own profile (for the trigger)
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', '')
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================================
-- 2. TRIPS
-- =============================================================
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

CREATE INDEX idx_trips_created_by ON trips(created_by);

ALTER TABLE trips ENABLE ROW LEVEL SECURITY;

-- Users can see trips they created or are a member of
CREATE POLICY "Users can view their trips"
  ON trips FOR SELECT
  TO authenticated
  USING (
    created_by = auth.uid()
    OR id IN (
      SELECT trip_id FROM trip_members WHERE user_id = auth.uid()
    )
  );

-- Only the creator can insert (they set created_by = their uid)
CREATE POLICY "Users can create trips"
  ON trips FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

-- Only the creator can update
CREATE POLICY "Trip creator can update"
  ON trips FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- Only the creator can delete
CREATE POLICY "Trip creator can delete"
  ON trips FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());

-- Allow anyone to look up a trip by invite code (for joining)
CREATE POLICY "Anyone can lookup trip by invite code"
  ON trips FOR SELECT
  TO authenticated
  USING (invite_code IS NOT NULL);

-- =============================================================
-- 3. TRIP MEMBERS
-- =============================================================
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

CREATE INDEX idx_trip_members_trip_id ON trip_members(trip_id);
CREATE INDEX idx_trip_members_user_id ON trip_members(user_id);
CREATE UNIQUE INDEX idx_trip_members_unique ON trip_members(trip_id, user_id) WHERE user_id IS NOT NULL;

ALTER TABLE trip_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members viewable by trip participants"
  ON trip_members FOR SELECT
  TO authenticated
  USING (
    trip_id IN (
      SELECT id FROM trips WHERE created_by = auth.uid()
    )
    OR trip_id IN (
      SELECT trip_id FROM trip_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Trip creator can manage members"
  ON trip_members FOR INSERT
  TO authenticated
  WITH CHECK (
    trip_id IN (
      SELECT id FROM trips WHERE created_by = auth.uid()
    )
    OR user_id = auth.uid()
  );

CREATE POLICY "Trip creator can update members"
  ON trip_members FOR UPDATE
  TO authenticated
  USING (
    trip_id IN (
      SELECT id FROM trips WHERE created_by = auth.uid()
    )
    OR user_id = auth.uid()
  );

CREATE POLICY "Trip creator can delete members"
  ON trip_members FOR DELETE
  TO authenticated
  USING (
    trip_id IN (
      SELECT id FROM trips WHERE created_by = auth.uid()
    )
  );

-- =============================================================
-- 4. ITINERARY ITEMS
-- =============================================================
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

CREATE INDEX idx_itinerary_items_trip_id ON itinerary_items(trip_id);

ALTER TABLE itinerary_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Itinerary viewable by trip participants"
  ON itinerary_items FOR SELECT
  TO authenticated
  USING (
    trip_id IN (
      SELECT id FROM trips WHERE created_by = auth.uid()
    )
    OR trip_id IN (
      SELECT trip_id FROM trip_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Trip creator can manage itinerary"
  ON itinerary_items FOR ALL
  TO authenticated
  USING (
    trip_id IN (
      SELECT id FROM trips WHERE created_by = auth.uid()
    )
  );

-- =============================================================
-- 5. EXPENSES
-- =============================================================
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

CREATE INDEX idx_expenses_trip_id ON expenses(trip_id);

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Expenses viewable by trip participants"
  ON expenses FOR SELECT
  TO authenticated
  USING (
    trip_id IN (
      SELECT id FROM trips WHERE created_by = auth.uid()
    )
    OR trip_id IN (
      SELECT trip_id FROM trip_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Trip participants can create expenses"
  ON expenses FOR INSERT
  TO authenticated
  WITH CHECK (
    trip_id IN (
      SELECT id FROM trips WHERE created_by = auth.uid()
    )
    OR trip_id IN (
      SELECT trip_id FROM trip_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Trip creator can update expenses"
  ON expenses FOR UPDATE
  TO authenticated
  USING (
    trip_id IN (
      SELECT id FROM trips WHERE created_by = auth.uid()
    )
    OR trip_id IN (
      SELECT trip_id FROM trip_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Trip creator can delete expenses"
  ON expenses FOR DELETE
  TO authenticated
  USING (
    trip_id IN (
      SELECT id FROM trips WHERE created_by = auth.uid()
    )
  );

-- =============================================================
-- 6. EXPENSE SPLITS
-- =============================================================
CREATE TABLE expense_splits (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  expense_id UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  member_id  UUID NOT NULL REFERENCES trip_members(id) ON DELETE CASCADE,
  amount     NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_expense_splits_expense_id ON expense_splits(expense_id);
CREATE INDEX idx_expense_splits_member_id ON expense_splits(member_id);

ALTER TABLE expense_splits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Expense splits viewable by trip participants"
  ON expense_splits FOR SELECT
  TO authenticated
  USING (
    expense_id IN (
      SELECT e.id FROM expenses e
      JOIN trips t ON t.id = e.trip_id
      WHERE t.created_by = auth.uid()
    )
    OR expense_id IN (
      SELECT e.id FROM expenses e
      JOIN trip_members tm ON tm.trip_id = e.trip_id
      WHERE tm.user_id = auth.uid()
    )
  );

CREATE POLICY "Trip participants can manage expense splits"
  ON expense_splits FOR ALL
  TO authenticated
  USING (
    expense_id IN (
      SELECT e.id FROM expenses e
      JOIN trips t ON t.id = e.trip_id
      WHERE t.created_by = auth.uid()
    )
    OR expense_id IN (
      SELECT e.id FROM expenses e
      JOIN trip_members tm ON tm.trip_id = e.trip_id
      WHERE tm.user_id = auth.uid()
    )
  );

-- =============================================================
-- 7. ROUNDS / PAIRINGS
-- =============================================================
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

CREATE INDEX idx_rounds_trip_id ON rounds(trip_id);

ALTER TABLE rounds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Rounds viewable by trip participants"
  ON rounds FOR SELECT
  TO authenticated
  USING (
    trip_id IN (
      SELECT id FROM trips WHERE created_by = auth.uid()
    )
    OR trip_id IN (
      SELECT trip_id FROM trip_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Trip participants can manage rounds"
  ON rounds FOR ALL
  TO authenticated
  USING (
    trip_id IN (
      SELECT id FROM trips WHERE created_by = auth.uid()
    )
    OR trip_id IN (
      SELECT trip_id FROM trip_members WHERE user_id = auth.uid()
    )
  );

-- =============================================================
-- 8. SKINS GAMES
-- =============================================================
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

CREATE INDEX idx_skins_games_trip_id ON skins_games(trip_id);

ALTER TABLE skins_games ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Skins games viewable by trip participants"
  ON skins_games FOR SELECT
  TO authenticated
  USING (
    trip_id IN (
      SELECT id FROM trips WHERE created_by = auth.uid()
    )
    OR trip_id IN (
      SELECT trip_id FROM trip_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Trip participants can manage skins games"
  ON skins_games FOR ALL
  TO authenticated
  USING (
    trip_id IN (
      SELECT id FROM trips WHERE created_by = auth.uid()
    )
    OR trip_id IN (
      SELECT trip_id FROM trip_members WHERE user_id = auth.uid()
    )
  );

-- =============================================================
-- 9. SCORECARDS
-- =============================================================
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

CREATE INDEX idx_scorecards_user_id ON scorecards(user_id);
CREATE INDEX idx_scorecards_trip_id ON scorecards(trip_id);

ALTER TABLE scorecards ENABLE ROW LEVEL SECURITY;

-- Users can see their own scorecards and those for trips they belong to
CREATE POLICY "Users can view own scorecards"
  ON scorecards FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR trip_id IN (
      SELECT id FROM trips WHERE created_by = auth.uid()
    )
    OR trip_id IN (
      SELECT trip_id FROM trip_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create own scorecards"
  ON scorecards FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own scorecards"
  ON scorecards FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own scorecards"
  ON scorecards FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- =============================================================
-- 10. WAITLIST
-- =============================================================
CREATE TABLE waitlist (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email      TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (signup form)
CREATE POLICY "Anyone can join waitlist"
  ON waitlist FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Only authenticated users (admin) can view
CREATE POLICY "Authenticated users can view waitlist"
  ON waitlist FOR SELECT
  TO authenticated
  USING (true);

-- =============================================================
-- updated_at trigger function
-- =============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_trips_updated_at
  BEFORE UPDATE ON trips
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
