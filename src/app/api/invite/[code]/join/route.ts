import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser, unauthorized } from "@/lib/auth";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const user = await getUser();
  if (!user) return unauthorized();

  const { code } = await params;

  const trip = await prisma.trips.findUnique({
    where: { invite_code: code },
  });

  if (!trip) {
    return NextResponse.json({ error: "Invalid invite link" }, { status: 404 });
  }

  // Check if user is already a member via trip_members table
  const existing = await prisma.tripMembers.findFirst({
    where: { trip_id: trip.id, user_id: user.id },
  });

  if (existing) {
    return NextResponse.json({ tripId: trip.id, alreadyMember: true });
  }

  // Add the user as a new member
  await prisma.tripMembers.create({
    data: {
      trip_id: trip.id,
      user_id: user.id,
      name: user.email?.split("@")[0] || "Guest",
      role: "MEMBER",
      rsvp_status: "GOING",
    },
  });

  return NextResponse.json({ tripId: trip.id, alreadyMember: false });
}
