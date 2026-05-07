ALTER TABLE trip_members
  ADD COLUMN IF NOT EXISTS email TEXT;

CREATE INDEX IF NOT EXISTS idx_trip_members_email ON trip_members (email);
