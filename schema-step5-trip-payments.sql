-- Trip-level payment tracking for Per-Trip Pass
ALTER TABLE "Trips"
  ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'unpaid',
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;

ALTER TABLE "Trips"
  DROP CONSTRAINT IF EXISTS trips_payment_status_valid;

ALTER TABLE "Trips"
  ADD CONSTRAINT trips_payment_status_valid
  CHECK (payment_status IN ('unpaid', 'paid', 'pro_covered', 'founding_covered'));

CREATE INDEX IF NOT EXISTS idx_trips_payment_status ON "Trips" (payment_status);
