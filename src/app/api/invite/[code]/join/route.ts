import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser, unauthorized } from "@/lib/auth";
import { apiError } from "@/lib/api-utils";
import { isTripUnlocked } from "@/lib/trip-payment";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const user = await getUser();
    if (!user) return unauthorized();

    const { code } = await params;

    const trip = await prisma.trips.findUnique({
      where: { invite_code: code },
      include: {
        creator: {
          select: {
            subscription_tier: true,
            subscription_status: true,
          },
        },
      },
    });

    if (!trip) {
      return NextResponse.json({ error: "Invalid invite link" }, { status: 404 });
    }

    const captain = (trip as any).creator || {
      subscription_tier: null,
      subscription_status: null,
    };
    if (
      !isTripUnlocked(
        { payment_status: (trip as any).payment_status ?? null },
        captain
      )
    ) {
      return NextResponse.json(
        { error: "Trip is not yet open for joining" },
        { status: 403 }
      );
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
  } catch (err) {
    return apiError(err, "POST /api/invite/[code]/join");
  }
}
