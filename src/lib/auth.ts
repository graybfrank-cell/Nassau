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
 */
export async function getTripMembership(tripId: string, userId: string) {
  return prisma.tripMembers.findFirst({
    where: { tripId, userId },
  });
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
