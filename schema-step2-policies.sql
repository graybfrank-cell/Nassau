-- =============================================================
-- Nassau — Step 2: Enable RLS & Create Policies
-- Run this SECOND (after step 1 tables exist)
-- =============================================================

-- =============================================================
-- ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- =============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE itinerary_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE skins_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE scorecards ENABLE ROW LEVEL SECURITY;
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

-- =============================================================
-- PROFILES POLICIES
-- =============================================================
CREATE POLICY "Profiles are viewable by authenticated users"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- =============================================================
-- TRIPS POLICIES
-- =============================================================
CREATE POLICY "Users can view their trips"
  ON trips FOR SELECT
  TO authenticated
  USING (
    created_by = auth.uid()
    OR id IN (
      SELECT trip_id FROM trip_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create trips"
  ON trips FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Trip creator can update"
  ON trips FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Trip creator can delete"
  ON trips FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "Anyone can lookup trip by invite code"
  ON trips FOR SELECT
  TO authenticated
  USING (invite_code IS NOT NULL);

-- =============================================================
-- TRIP MEMBERS POLICIES
-- =============================================================
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
-- ITINERARY ITEMS POLICIES
-- =============================================================
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
-- EXPENSES POLICIES
-- =============================================================
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
-- EXPENSE SPLITS POLICIES
-- =============================================================
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
-- ROUNDS POLICIES
-- =============================================================
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
-- SKINS GAMES POLICIES
-- =============================================================
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
-- SCORECARDS POLICIES
-- =============================================================
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
-- WAITLIST POLICIES
-- =============================================================
CREATE POLICY "Anyone can join waitlist"
  ON waitlist FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view waitlist"
  ON waitlist FOR SELECT
  TO authenticated
  USING (true);
