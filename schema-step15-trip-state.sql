-- No new columns needed — state is derived from existing start_date/end_date.
-- This migration adds an optional column for tracking the moment the trip
-- transitioned to active, which is useful for analytics and the live ribbon.

ALTER TABLE trips
  ADD COLUMN IF NOT EXISTS first_active_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_trips_first_active_at ON trips (first_active_at);
