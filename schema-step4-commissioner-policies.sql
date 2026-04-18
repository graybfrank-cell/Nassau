-- =============================================================
-- Nassau — Step 4: Enable RLS & Create Policies on Commissioner tables
-- Run this FOURTH (after steps 1-3).
--
-- Covers the 9 tables that were left without RLS in step 2:
--   game_rounds, game_players, game_scorecards, game_skins_games,
--   game_nassau_bets, game_expenses, game_settlements,
--   settlements, marketing_partnerships
--
-- Policy shape mirrors the trips policies in step 2:
--   * Commissioner = full read/write on their own rounds
--   * Players = read rounds they're in + manage their own scorecard
--   * Share-code lookups allowed for authenticated users (needed for
--     the /api/game-rounds/invite/[shareCode] join flow)
--   * marketing_partnerships is admin-only (service-role bypasses RLS;
--     we enable RLS with no policies so authenticated users are blocked)
-- =============================================================

-- =============================================================
-- ENABLE ROW LEVEL SECURITY
-- =============================================================
ALTER TABLE game_rounds           ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_players          ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_scorecards       ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_skins_games      ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_nassau_bets      ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_expenses         ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_settlements      ENABLE ROW LEVEL SECURITY;
ALTER TABLE settlements           ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_partnerships ENABLE ROW LEVEL SECURITY;

-- =============================================================
-- GAME ROUNDS POLICIES
-- =============================================================
CREATE POLICY "Game rounds viewable by commissioner or players"
  ON game_rounds FOR SELECT
  TO authenticated
  USING (
    commissioner_id = auth.uid()
    OR id IN (
      SELECT round_id FROM game_players WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can lookup game round by share code"
  ON game_rounds FOR SELECT
  TO authenticated
  USING (share_code IS NOT NULL);

CREATE POLICY "Users can create game rounds as commissioner"
  ON game_rounds FOR INSERT
  TO authenticated
  WITH CHECK (commissioner_id = auth.uid());

CREATE POLICY "Commissioner can update game rounds"
  ON game_rounds FOR UPDATE
  TO authenticated
  USING (commissioner_id = auth.uid())
  WITH CHECK (commissioner_id = auth.uid());

CREATE POLICY "Commissioner can delete game rounds"
  ON game_rounds FOR DELETE
  TO authenticated
  USING (commissioner_id = auth.uid());

-- =============================================================
-- GAME PLAYERS POLICIES
-- =============================================================
CREATE POLICY "Game players viewable by commissioner or co-players"
  ON game_players FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR round_id IN (
      SELECT id FROM game_rounds WHERE commissioner_id = auth.uid()
    )
    OR round_id IN (
      SELECT round_id FROM game_players WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Commissioner can add players; invitees can self-join"
  ON game_players FOR INSERT
  TO authenticated
  WITH CHECK (
    round_id IN (
      SELECT id FROM game_rounds WHERE commissioner_id = auth.uid()
    )
    OR user_id = auth.uid()
  );

CREATE POLICY "Commissioner or player can update own row"
  ON game_players FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR round_id IN (
      SELECT id FROM game_rounds WHERE commissioner_id = auth.uid()
    )
  );

CREATE POLICY "Commissioner can remove players"
  ON game_players FOR DELETE
  TO authenticated
  USING (
    round_id IN (
      SELECT id FROM game_rounds WHERE commissioner_id = auth.uid()
    )
  );

-- =============================================================
-- GAME SCORECARDS POLICIES
-- =============================================================
CREATE POLICY "Game scorecards viewable by round participants"
  ON game_scorecards FOR SELECT
  TO authenticated
  USING (
    round_id IN (
      SELECT id FROM game_rounds WHERE commissioner_id = auth.uid()
    )
    OR round_id IN (
      SELECT round_id FROM game_players WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Commissioner or own player can insert scorecards"
  ON game_scorecards FOR INSERT
  TO authenticated
  WITH CHECK (
    round_id IN (
      SELECT id FROM game_rounds WHERE commissioner_id = auth.uid()
    )
    OR player_id IN (
      SELECT id FROM game_players WHERE user_id = auth.uid() AND round_id = game_scorecards.round_id
    )
  );

CREATE POLICY "Commissioner or own player can update scorecards"
  ON game_scorecards FOR UPDATE
  TO authenticated
  USING (
    round_id IN (
      SELECT id FROM game_rounds WHERE commissioner_id = auth.uid()
    )
    OR player_id IN (
      SELECT id FROM game_players WHERE user_id = auth.uid() AND round_id = game_scorecards.round_id
    )
  );

CREATE POLICY "Commissioner can delete scorecards"
  ON game_scorecards FOR DELETE
  TO authenticated
  USING (
    round_id IN (
      SELECT id FROM game_rounds WHERE commissioner_id = auth.uid()
    )
  );

-- =============================================================
-- GAME SKINS GAMES POLICIES
-- =============================================================
CREATE POLICY "Skins games viewable by round participants"
  ON game_skins_games FOR SELECT
  TO authenticated
  USING (
    round_id IN (
      SELECT id FROM game_rounds WHERE commissioner_id = auth.uid()
    )
    OR round_id IN (
      SELECT round_id FROM game_players WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Commissioner can manage skins games"
  ON game_skins_games FOR ALL
  TO authenticated
  USING (
    round_id IN (
      SELECT id FROM game_rounds WHERE commissioner_id = auth.uid()
    )
  )
  WITH CHECK (
    round_id IN (
      SELECT id FROM game_rounds WHERE commissioner_id = auth.uid()
    )
  );

-- =============================================================
-- GAME NASSAU BETS POLICIES
-- =============================================================
CREATE POLICY "Nassau bets viewable by round participants"
  ON game_nassau_bets FOR SELECT
  TO authenticated
  USING (
    round_id IN (
      SELECT id FROM game_rounds WHERE commissioner_id = auth.uid()
    )
    OR round_id IN (
      SELECT round_id FROM game_players WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Commissioner can manage nassau bets"
  ON game_nassau_bets FOR ALL
  TO authenticated
  USING (
    round_id IN (
      SELECT id FROM game_rounds WHERE commissioner_id = auth.uid()
    )
  )
  WITH CHECK (
    round_id IN (
      SELECT id FROM game_rounds WHERE commissioner_id = auth.uid()
    )
  );

-- =============================================================
-- GAME EXPENSES POLICIES
-- =============================================================
CREATE POLICY "Game expenses viewable by round participants"
  ON game_expenses FOR SELECT
  TO authenticated
  USING (
    round_id IN (
      SELECT id FROM game_rounds WHERE commissioner_id = auth.uid()
    )
    OR round_id IN (
      SELECT round_id FROM game_players WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Round participants can create game expenses"
  ON game_expenses FOR INSERT
  TO authenticated
  WITH CHECK (
    round_id IN (
      SELECT id FROM game_rounds WHERE commissioner_id = auth.uid()
    )
    OR round_id IN (
      SELECT round_id FROM game_players WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Commissioner or payer can update game expenses"
  ON game_expenses FOR UPDATE
  TO authenticated
  USING (
    paid_by = auth.uid()
    OR round_id IN (
      SELECT id FROM game_rounds WHERE commissioner_id = auth.uid()
    )
  );

CREATE POLICY "Commissioner or payer can delete game expenses"
  ON game_expenses FOR DELETE
  TO authenticated
  USING (
    paid_by = auth.uid()
    OR round_id IN (
      SELECT id FROM game_rounds WHERE commissioner_id = auth.uid()
    )
  );

-- =============================================================
-- GAME SETTLEMENTS POLICIES
-- =============================================================
CREATE POLICY "Game settlements viewable by involved parties"
  ON game_settlements FOR SELECT
  TO authenticated
  USING (
    from_player IN (
      SELECT id FROM game_players WHERE user_id = auth.uid()
    )
    OR to_player IN (
      SELECT id FROM game_players WHERE user_id = auth.uid()
    )
    OR round_id IN (
      SELECT id FROM game_rounds WHERE commissioner_id = auth.uid()
    )
  );

CREATE POLICY "Commissioner can create game settlements"
  ON game_settlements FOR INSERT
  TO authenticated
  WITH CHECK (
    round_id IN (
      SELECT id FROM game_rounds WHERE commissioner_id = auth.uid()
    )
  );

CREATE POLICY "Commissioner or payer/payee can update game settlements"
  ON game_settlements FOR UPDATE
  TO authenticated
  USING (
    round_id IN (
      SELECT id FROM game_rounds WHERE commissioner_id = auth.uid()
    )
    OR from_player IN (
      SELECT id FROM game_players WHERE user_id = auth.uid()
    )
    OR to_player IN (
      SELECT id FROM game_players WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Commissioner can delete game settlements"
  ON game_settlements FOR DELETE
  TO authenticated
  USING (
    round_id IN (
      SELECT id FROM game_rounds WHERE commissioner_id = auth.uid()
    )
  );

-- =============================================================
-- SETTLEMENTS POLICIES (trip-level)
-- =============================================================
CREATE POLICY "Settlements viewable by involved parties"
  ON settlements FOR SELECT
  TO authenticated
  USING (
    payer_id = auth.uid()
    OR payee_id = auth.uid()
    OR (trip_id IS NOT NULL AND trip_id IN (
      SELECT id FROM trips WHERE created_by = auth.uid()
    ))
    OR (round_id IS NOT NULL AND round_id IN (
      SELECT id FROM game_rounds WHERE commissioner_id = auth.uid()
    ))
  );

CREATE POLICY "Involved parties or trip creator can create settlements"
  ON settlements FOR INSERT
  TO authenticated
  WITH CHECK (
    payer_id = auth.uid()
    OR payee_id = auth.uid()
    OR (trip_id IS NOT NULL AND trip_id IN (
      SELECT id FROM trips WHERE created_by = auth.uid()
    ))
    OR (round_id IS NOT NULL AND round_id IN (
      SELECT id FROM game_rounds WHERE commissioner_id = auth.uid()
    ))
  );

CREATE POLICY "Involved parties or trip creator can update settlements"
  ON settlements FOR UPDATE
  TO authenticated
  USING (
    payer_id = auth.uid()
    OR payee_id = auth.uid()
    OR (trip_id IS NOT NULL AND trip_id IN (
      SELECT id FROM trips WHERE created_by = auth.uid()
    ))
    OR (round_id IS NOT NULL AND round_id IN (
      SELECT id FROM game_rounds WHERE commissioner_id = auth.uid()
    ))
  );

CREATE POLICY "Trip creator or commissioner can delete settlements"
  ON settlements FOR DELETE
  TO authenticated
  USING (
    (trip_id IS NOT NULL AND trip_id IN (
      SELECT id FROM trips WHERE created_by = auth.uid()
    ))
    OR (round_id IS NOT NULL AND round_id IN (
      SELECT id FROM game_rounds WHERE commissioner_id = auth.uid()
    ))
  );

-- =============================================================
-- MARKETING PARTNERSHIPS POLICIES
-- =============================================================
-- Admin-only table. Service role key bypasses RLS entirely, so we
-- enable RLS with ZERO policies for authenticated/anon users. That
-- means any query using the anon key or a logged-in user's session
-- returns empty. Only server-side code using SUPABASE_SERVICE_ROLE_KEY
-- (i.e. createServiceClient()) can read/write this table.
-- No CREATE POLICY statements here by design.

-- =============================================================
-- VERIFICATION (run this after the above to confirm coverage)
-- =============================================================
-- Expected result: every table below returns rowsecurity = true
--
--   SELECT schemaname, tablename, rowsecurity
--   FROM pg_tables
--   WHERE tablename IN (
--     'game_rounds', 'game_players', 'game_scorecards',
--     'game_skins_games', 'game_nassau_bets', 'game_expenses',
--     'game_settlements', 'settlements', 'marketing_partnerships'
--   );
--
-- Expected result: list of policies grouped by table
--
--   SELECT tablename, policyname, cmd
--   FROM pg_policies
--   WHERE tablename IN (
--     'game_rounds', 'game_players', 'game_scorecards',
--     'game_skins_games', 'game_nassau_bets', 'game_expenses',
--     'game_settlements', 'settlements'
--   )
--   ORDER BY tablename, cmd, policyname;
