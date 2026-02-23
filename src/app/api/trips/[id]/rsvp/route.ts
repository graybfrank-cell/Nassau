import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser, unauthorized } from "@/lib/auth";

// POST /api/trips/[id]/rsvp
// Body: { status: 'GOING' | 'MAYBE' | 'DECLINED' }
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user) return unauthorized();

  const { id: tripId } = await params;
  const body = await req.json();
  const status = body.status;

  if (!["GOING", "MAYBE", "DECLINED"].includes(status)) {
    return NextResponse.json(
      { error: "Invalid status. Must be GOING, MAYBE, or DECLINED." },
      { status: 400 }
    );
  }

  // Find the member record
  let member = await prisma.tripMembers.findFirst({
    where: { trip_id: tripId, user_id: user.id },
  });

  if (!member) {
    // Check if there's an invite by email
    const profile = await prisma.profiles.findUnique({
      where: { id: user.id },
    });

    if (profile?.email) {
      const emailMember = await prisma.tripMembers.findFirst({
        where: { trip_id: tripId, email: profile.email, user_id: null },
      });

      if (emailMember) {
        // Link and update
        const updated = await prisma.tripMembers.update({
          where: { id: emailMember.id },
          data: {
            user_id: user.id,
            name: profile.full_name || emailMember.name,
            rsvp_status: status,
            rsvp_at: new Date(),
          },
        });
        return NextResponse.json(updated);
      }
    }

    return NextResponse.json(
      { error: "You are not a member of this trip" },
      { status: 403 }
    );
  }

  // Captain can't un-GOING themselves
  if (member.role === "CAPTAIN" && status !== "GOING") {
    return NextResponse.json(
      { error: "The captain must stay as GOING" },
      { status: 400 }
    );
  }

  const updated = await prisma.tripMembers.update({
    where: { id: member.id },
    data: {
      rsvp_status: status,
      rsvp_at: new Date(),
    },
  });

  return NextResponse.json(updated);
}
