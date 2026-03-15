-- Commissioner Mode: Enable RLS + Policies for all game_* tables
-- Run in Supabase SQL Editor

-- ═══════════════════════════════════════════════════════════════
-- 1. ENABLE RLS ON ALL COMMISSIONER MODE TABLES
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE game_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_scorecards ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_skins_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_nassau_bets ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_settlements ENABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════════════
-- 2. GAME_ROUNDS POLICIES
-- ═══════════════════════════════════════════════════════════════

-- Round members (commissioner + players) can read
CREATE POLICY "Round members can view rounds" ON game_rounds
  FOR SELECT TO authenticated
  USING (
    commissioner_id = auth.uid()
    OR id IN (
      SELECT round_id FROM game_players WHERE user_id = auth.uid()
    )
  );

-- Anyone authenticated can read by share_code (for invite flow)
CREATE POLICY "Anyone can lookup round by share code" ON game_rounds
  FOR SELECT TO authenticated
  USING (share_code IS NOT NULL);

-- Only authenticated users can create rounds (as commissioner)
CREATE POLICY "Users can create rounds" ON game_rounds
  FOR INSERT TO authenticated
  WITH CHECK (commissioner_id = auth.uid());

-- Only commissioner can update
CREATE POLICY "Commissioner can update round" ON game_rounds
  FOR UPDATE TO authenticated
  USING (commissioner_id = auth.uid())
  WITH CHECK (commissioner_id = auth.uid());

-- Only commissioner can delete
CREATE POLICY "Commissioner can delete round" ON game_rounds
  FOR DELETE TO authenticated
  USING (commissioner_id = auth.uid());

-- ═══════════════════════════════════════════════════════════════
-- 3. GAME_PLAYERS POLICIES
-- ═══════════════════════════════════════════════════════════════

-- Round members can view players
CREATE POLICY "Round members can view players" ON game_players
  FOR SELECT TO authenticated
  USING (
    round_id IN (
      SELECT id FROM game_rounds WHERE commissioner_id = auth.uid()
    )
    OR round_id IN (
      SELECT round_id FROM game_players WHERE user_id = auth.uid()
    )
  );

-- Commissioner or self can add players
CREATE POLICY "Commissioner or self can add players" ON game_players
  FOR INSERT TO authenticated
  WITH CHECK (
    round_id IN (
      SELECT id FROM game_rounds WHERE commissioner_id = auth.uid()
    )
    OR user_id = auth.uid()
  );

-- Commissioner or self can update players
CREATE POLICY "Commissioner can update players" ON game_players
  FOR UPDATE TO authenticated
  USING (
    round_id IN (
      SELECT id FROM game_rounds WHERE commissioner_id = auth.uid()
    )
    OR user_id = auth.uid()
  );

-- Commissioner can remove players
CREATE POLICY "Commissioner can delete players" ON game_players
  FOR DELETE TO authenticated
  USING (
    round_id IN (
      SELECT id FROM game_rounds WHERE commissioner_id = auth.uid()
    )
  );

-- ═══════════════════════════════════════════════════════════════
-- 4. GAME_SCORECARDS POLICIES
-- ═══════════════════════════════════════════════════════════════

-- Round members can view scorecards
CREATE POLICY "Round members can view scorecards" ON game_scorecards
  FOR SELECT TO authenticated
  USING (
    round_id IN (
      SELECT id FROM game_rounds WHERE commissioner_id = auth.uid()
    )
    OR round_id IN (
      SELECT round_id FROM game_players WHERE user_id = auth.uid()
    )
  );

-- Round members can create scorecards
CREATE POLICY "Round members can create scorecards" ON game_scorecards
  FOR INSERT TO authenticated
  WITH CHECK (
    round_id IN (
      SELECT id FROM game_rounds WHERE commissioner_id = auth.uid()
    )
    OR round_id IN (
      SELECT round_id FROM game_players WHERE user_id = auth.uid()
    )
  );

-- Round members can update scorecards
CREATE POLICY "Round members can update scorecards" ON game_scorecards
  FOR UPDATE TO authenticated
  USING (
    round_id IN (
      SELECT id FROM game_rounds WHERE commissioner_id = auth.uid()
    )
    OR round_id IN (
      SELECT round_id FROM game_players WHERE user_id = auth.uid()
    )
  );

-- ═══════════════════════════════════════════════════════════════
-- 5. GAME_SKINS_GAMES POLICIES
-- ═══════════════════════════════════════════════════════════════

-- Round members can view skins games
CREATE POLICY "Round members can view skins" ON game_skins_games
  FOR SELECT TO authenticated
  USING (
    round_id IN (
      SELECT id FROM game_rounds WHERE commissioner_id = auth.uid()
    )
    OR round_id IN (
      SELECT round_id FROM game_players WHERE user_id = auth.uid()
    )
  );

-- Commissioner can create skins games
CREATE POLICY "Commissioner can manage skins" ON game_skins_games
  FOR INSERT TO authenticated
  WITH CHECK (
    round_id IN (
      SELECT id FROM game_rounds WHERE commissioner_id = auth.uid()
    )
  );

-- Commissioner can update skins games
CREATE POLICY "Commissioner can update skins" ON game_skins_games
  FOR UPDATE TO authenticated
  USING (
    round_id IN (
      SELECT id FROM game_rounds WHERE commissioner_id = auth.uid()
    )
  );

-- Commissioner can delete skins games
CREATE POLICY "Commissioner can delete skins" ON game_skins_games
  FOR DELETE TO authenticated
  USING (
    round_id IN (
      SELECT id FROM game_rounds WHERE commissioner_id = auth.uid()
    )
  );

-- ═══════════════════════════════════════════════════════════════
-- 6. GAME_NASSAU_BETS POLICIES
-- ═══════════════════════════════════════════════════════════════

-- Round members can view nassau bets
CREATE POLICY "Round members can view nassau bets" ON game_nassau_bets
  FOR SELECT TO authenticated
  USING (
    round_id IN (
      SELECT id FROM game_rounds WHERE commissioner_id = auth.uid()
    )
    OR round_id IN (
      SELECT round_id FROM game_players WHERE user_id = auth.uid()
    )
  );

-- Commissioner can create nassau bets
CREATE POLICY "Commissioner can manage nassau bets" ON game_nassau_bets
  FOR INSERT TO authenticated
  WITH CHECK (
    round_id IN (
      SELECT id FROM game_rounds WHERE commissioner_id = auth.uid()
    )
  );

-- Commissioner can update nassau bets
CREATE POLICY "Commissioner can update nassau bets" ON game_nassau_bets
  FOR UPDATE TO authenticated
  USING (
    round_id IN (
      SELECT id FROM game_rounds WHERE commissioner_id = auth.uid()
    )
  );

-- Commissioner can delete nassau bets
CREATE POLICY "Commissioner can delete nassau bets" ON game_nassau_bets
  FOR DELETE TO authenticated
  USING (
    round_id IN (
      SELECT id FROM game_rounds WHERE commissioner_id = auth.uid()
    )
  );

-- ═══════════════════════════════════════════════════════════════
-- 7. GAME_EXPENSES POLICIES
-- ═══════════════════════════════════════════════════════════════

-- Round members can view expenses
CREATE POLICY "Round members can view expenses" ON game_expenses
  FOR SELECT TO authenticated
  USING (
    round_id IN (
      SELECT id FROM game_rounds WHERE commissioner_id = auth.uid()
    )
    OR round_id IN (
      SELECT round_id FROM game_players WHERE user_id = auth.uid()
    )
  );

-- Round members can create expenses
CREATE POLICY "Round members can create expenses" ON game_expenses
  FOR INSERT TO authenticated
  WITH CHECK (
    round_id IN (
      SELECT id FROM game_rounds WHERE commissioner_id = auth.uid()
    )
    OR round_id IN (
      SELECT round_id FROM game_players WHERE user_id = auth.uid()
    )
  );

-- Commissioner can update expenses
CREATE POLICY "Commissioner can update expenses" ON game_expenses
  FOR UPDATE TO authenticated
  USING (
    round_id IN (
      SELECT id FROM game_rounds WHERE commissioner_id = auth.uid()
    )
  );

-- Commissioner can delete expenses
CREATE POLICY "Commissioner can delete expenses" ON game_expenses
  FOR DELETE TO authenticated
  USING (
    round_id IN (
      SELECT id FROM game_rounds WHERE commissioner_id = auth.uid()
    )
  );

-- ═══════════════════════════════════════════════════════════════
-- 8. GAME_SETTLEMENTS POLICIES
-- ═══════════════════════════════════════════════════════════════

-- Round members can view settlements
CREATE POLICY "Round members can view settlements" ON game_settlements
  FOR SELECT TO authenticated
  USING (
    round_id IN (
      SELECT id FROM game_rounds WHERE commissioner_id = auth.uid()
    )
    OR round_id IN (
      SELECT round_id FROM game_players WHERE user_id = auth.uid()
    )
  );

-- Round members can create settlements
CREATE POLICY "Round members can create settlements" ON game_settlements
  FOR INSERT TO authenticated
  WITH CHECK (
    round_id IN (
      SELECT id FROM game_rounds WHERE commissioner_id = auth.uid()
    )
    OR round_id IN (
      SELECT round_id FROM game_players WHERE user_id = auth.uid()
    )
  );

-- Participants (from/to) or commissioner can update settlements
CREATE POLICY "Participants can update settlements" ON game_settlements
  FOR UPDATE TO authenticated
  USING (
    from_player = auth.uid()
    OR to_player = auth.uid()
    OR round_id IN (
      SELECT id FROM game_rounds WHERE commissioner_id = auth.uid()
    )
  );
