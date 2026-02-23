import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

/**
 * Get the authenticated user or return a 401 response.
 */
export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/**
 * Verify the caller is a member of the given trip.
 * Returns the TripMember row, or null if not a member.
 * Also grants access if the user is the trip creator (created_by).
 */
export async function getTripMembership(tripId: string, userId: string) {
  const member = await prisma.tripMembers.findFirst({
    where: { trip_id: tripId, user_id: userId },
  });
  if (member) return member;

  // Fallback: the trip creator always has access even without a members row
  const trip = await prisma.trips.findFirst({
    where: { id: tripId, created_by: userId },
  });
  if (!trip) return null;

  // Auto-create the missing member row for the creator.
  // Use try/catch to handle race conditions: when multiple parallel requests
  // (e.g. expenses + rounds + skins + scorecards) all arrive simultaneously,
  // the first create succeeds but the others hit a unique constraint error.
  try {
    return await prisma.tripMembers.create({
      data: {
        trip_id: tripId,
        user_id: userId,
        name: "Captain",
        role: "CAPTAIN",
        rsvp_status: "GOING",
      },
    });
  } catch {
    // Another concurrent request already created the row — fetch it
    return prisma.tripMembers.findFirst({
      where: { trip_id: tripId, user_id: userId },
    });
  }
}

/**
 * Standard 401 response.
 */
export function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

/**
 * Standard 403 response.
 */
export function forbidden() {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}
