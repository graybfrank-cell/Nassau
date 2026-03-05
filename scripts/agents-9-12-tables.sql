-- Migration: Agents 9–12 tables
-- Onboarding, Reactivation, SEO Writer, Referral Tracker

-- Agent 9 — Onboarding
CREATE TABLE IF NOT EXISTS onboarding_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  signup_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  day0_sent BOOLEAN DEFAULT FALSE,
  day0_sent_at TIMESTAMPTZ,
  day3_sent BOOLEAN DEFAULT FALSE,
  day3_sent_at TIMESTAMPTZ,
  day7_sent BOOLEAN DEFAULT FALSE,
  day7_sent_at TIMESTAMPTZ,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agent 10 — Reactivation
CREATE TABLE IF NOT EXISTS reactivation_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  last_active_at TIMESTAMPTZ,
  last_action TEXT,
  email_sent_at TIMESTAMPTZ,
  email_subject TEXT,
  opened BOOLEAN DEFAULT FALSE,
  clicked BOOLEAN DEFAULT FALSE,
  reactivated BOOLEAN DEFAULT FALSE,
  reactivated_at TIMESTAMPTZ,
  churned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agent 11 — SEO Writer
CREATE TABLE IF NOT EXISTS seo_blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  meta_description TEXT,
  target_keyword TEXT,
  secondary_keywords TEXT[],
  content_markdown TEXT NOT NULL,
  word_count INTEGER,
  status TEXT DEFAULT 'draft',
  published_at TIMESTAMPTZ,
  page_views INTEGER DEFAULT 0,
  organic_clicks INTEGER DEFAULT 0,
  avg_position NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agent 12 — Referral Tracker
CREATE TABLE IF NOT EXISTS referral_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  code TEXT UNIQUE NOT NULL,
  clicks INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID REFERENCES auth.users(id),
  referred_id UUID REFERENCES auth.users(id),
  referral_code TEXT NOT NULL,
  signed_up_at TIMESTAMPTZ DEFAULT NOW(),
  reward_granted BOOLEAN DEFAULT FALSE,
  reward_granted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
