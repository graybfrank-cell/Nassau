export type TripState = "planning" | "active" | "complete";

export type TripDateFields = {
  start_date: string; // YYYY-MM-DD or empty string
  end_date: string;   // YYYY-MM-DD or empty string
};

/**
 * Determines a trip's lifecycle state based on its date range.
 * - "planning" if start_date is unset or in the future
 * - "active" if today is between start_date and end_date inclusive
 * - "complete" if end_date is in the past
 *
 * Uses UTC date comparison to avoid timezone edge cases.
 * String dates are expected in YYYY-MM-DD format (ISO date).
 */
export function getTripState(trip: TripDateFields, now: Date = new Date()): TripState {
  if (!trip.start_date || !trip.end_date) {
    return "planning";
  }

  // Parse YYYY-MM-DD as UTC midnight to avoid local timezone shifts
  const startUtc = new Date(`${trip.start_date}T00:00:00Z`);
  const endUtc = new Date(`${trip.end_date}T23:59:59Z`);

  if (isNaN(startUtc.getTime()) || isNaN(endUtc.getTime())) {
    return "planning";
  }

  if (now < startUtc) return "planning";
  if (now > endUtc) return "complete";
  return "active";
}

/**
 * Returns true if the trip is currently in its active window (mid-trip).
 */
export function isTripActive(trip: TripDateFields, now: Date = new Date()): boolean {
  return getTripState(trip, now) === "active";
}

/**
 * Returns the number of days until a planning trip starts (0 if active or complete).
 */
export function daysUntilTripStart(trip: TripDateFields, now: Date = new Date()): number {
  if (getTripState(trip, now) !== "planning") return 0;
  if (!trip.start_date) return 0;

  const startUtc = new Date(`${trip.start_date}T00:00:00Z`);
  const todayUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const diffMs = startUtc.getTime() - todayUtc.getTime();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

/**
 * Returns the day number within an active trip (1-indexed).
 * Returns 0 if not active.
 */
export function activeTripDayNumber(trip: TripDateFields, now: Date = new Date()): number {
  if (getTripState(trip, now) !== "active") return 0;
  if (!trip.start_date) return 0;

  const startUtc = new Date(`${trip.start_date}T00:00:00Z`);
  const todayUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const diffMs = todayUtc.getTime() - startUtc.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
}
