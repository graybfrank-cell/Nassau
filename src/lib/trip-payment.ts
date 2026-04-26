type TripPaymentFields = {
  payment_status: string | null;
};

type CaptainSubscriptionFields = {
  subscription_tier: string | null;
  subscription_status: string | null;
};

export type TripPaymentEffectiveStatus =
  | "unpaid"
  | "paid"
  | "founding_covered";

export function getTripPaymentEffectiveStatus(
  trip: TripPaymentFields,
  captain: CaptainSubscriptionFields
): TripPaymentEffectiveStatus {
  // Founding Member tier covers all trips
  if (
    captain.subscription_tier === "founding" &&
    captain.subscription_status === "active"
  ) {
    return "founding_covered";
  }

  // Otherwise, return the trip's own payment status
  if (trip.payment_status === "paid") return "paid";
  return "unpaid";
}

export function isTripUnlocked(
  trip: TripPaymentFields,
  captain: CaptainSubscriptionFields
): boolean {
  const status = getTripPaymentEffectiveStatus(trip, captain);
  return status === "paid" || status === "founding_covered";
}
