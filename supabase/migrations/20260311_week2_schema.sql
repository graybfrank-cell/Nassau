-- Week 2: Dashboard Redesign + Round Detail Enrichment + Engagement Features
-- Run in Supabase SQL Editor

-- ═══════════════════════════════════════════════════════════════
-- 1. Profiles: payment & subscription fields
-- ═══════════════════════════════════════════════════════════════
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS venmo_username TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT UNIQUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'free';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_tier TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ;

-- ═══════════════════════════════════════════════════════════════
-- 2. GameRounds: course enrichment + weather + awards
-- ═══════════════════════════════════════════════════════════════
ALTER TABLE game_rounds ADD COLUMN IF NOT EXISTS course_photo_url TEXT;
ALTER TABLE game_rounds ADD COLUMN IF NOT EXISTS course_address TEXT;
ALTER TABLE game_rounds ADD COLUMN IF NOT EXISTS course_lat DOUBLE PRECISION;
ALTER TABLE game_rounds ADD COLUMN IF NOT EXISTS course_lng DOUBLE PRECISION;
ALTER TABLE game_rounds ADD COLUMN IF NOT EXISTS weather_data JSONB;
ALTER TABLE game_rounds ADD COLUMN IF NOT EXISTS awards JSONB;

-- ═══════════════════════════════════════════════════════════════
-- 3. GamePlayers: personal best flag
-- ═══════════════════════════════════════════════════════════════
ALTER TABLE game_players ADD COLUMN IF NOT EXISTS is_personal_best BOOLEAN DEFAULT FALSE;

-- ═══════════════════════════════════════════════════════════════
-- 4. Settlements table (user-level, cross-round/trip)
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id UUID,
  trip_id UUID,
  payer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  payee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  note TEXT,
  status TEXT NOT NULL DEFAULT 'pending',  -- pending | paid | confirmed
  paid_at TIMESTAMPTZ,
  confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_settlements_payer ON settlements(payer_id);
CREATE INDEX IF NOT EXISTS idx_settlements_payee ON settlements(payee_id);
CREATE INDEX IF NOT EXISTS idx_settlements_round ON settlements(round_id);

-- ═══════════════════════════════════════════════════════════════
-- 5. RLS policies for settlements
-- ═══════════════════════════════════════════════════════════════
ALTER TABLE settlements ENABLE ROW LEVEL SECURITY;

-- Users can see settlements where they are payer or payee
CREATE POLICY "Users can view own settlements" ON settlements
  FOR SELECT USING (
    auth.uid() = payer_id OR auth.uid() = payee_id
  );

-- Users can insert settlements (service role handles most creation)
CREATE POLICY "Users can create settlements" ON settlements
  FOR INSERT WITH CHECK (
    auth.uid() = payer_id OR auth.uid() = payee_id
  );

-- Payer can mark as paid, payee can mark as confirmed
CREATE POLICY "Users can update own settlements" ON settlements
  FOR UPDATE USING (
    auth.uid() = payer_id OR auth.uid() = payee_id
  );

-- updated_at trigger for settlements
CREATE OR REPLACE FUNCTION update_settlements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER settlements_updated_at
  BEFORE UPDATE ON settlements
  FOR EACH ROW
  EXECUTE FUNCTION update_settlements_updated_at();
