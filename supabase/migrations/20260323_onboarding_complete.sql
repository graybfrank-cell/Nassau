-- Add onboarding_complete column to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_complete BOOLEAN DEFAULT false;

-- Mark existing profiles that have already completed onboarding as complete
UPDATE profiles
SET onboarding_complete = true
WHERE full_name != '' AND venmo_username IS NOT NULL;
