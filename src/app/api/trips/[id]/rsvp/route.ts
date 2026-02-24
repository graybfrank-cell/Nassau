import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser, unauthorized } from "@/lib/auth";
import { ensureDbColumns } from "@/lib/auto-migrate";

// POST /api/trips/[id]/rsvp
// Body: { status: 'GOING' | 'MAYBE' | 'DECLINED' }
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user) return unauthorized();

  const { id: tripId } = await params;

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const status = body.status;
  console.log("[RSVP API] POST /api/trips/" + tripId + "/rsvp — user:", user.id, "status:", status);

  if (!["GOING", "MAYBE", "DECLINED"].includes(status)) {
    return NextResponse.json(
      { error: "Invalid status. Must be GOING, MAYBE, or DECLINED." },
      { status: 400 }
    );
  }

  try {
    // Verify the trip exists
    let trip;
    try {
      trip = await prisma.trips.findUnique({ where: { id: tripId } });
    } catch {
      // Likely missing columns — auto-migrate and retry
      await ensureDbColumns();
      trip = await prisma.trips.findUnique({ where: { id: tripId } });
    }

    if (!trip) {
      console.log("[RSVP API] Trip not found:", tripId);
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }

    // Find the member record for this user
    let member = await prisma.tripMembers.findFirst({
      where: { trip_id: tripId, user_id: user.id },
    });
    console.log("[RSVP API] Existing member record:", member?.id || "none");

    if (!member) {
      // Check if there's an invite by email (link email invite to user account)
      const profile = await prisma.profiles.findUnique({
        where: { id: user.id },
      });

      if (profile?.email) {
        const emailMember = await prisma.tripMembers.findFirst({
          where: { trip_id: tripId, email: profile.email, user_id: null },
        });

        if (emailMember) {
          console.log("[RSVP API] Linking email invite to user:", emailMember.id);
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

      // No existing member record and no email invite — auto-add as new member
      // This enables RSVP from share links for users who weren't explicitly invited
      console.log("[RSVP API] Auto-adding user as new member via share link");
      const profile2 = await prisma.profiles.findUnique({
        where: { id: user.id },
      });
      const newMember = await prisma.tripMembers.create({
        data: {
          trip_id: tripId,
          user_id: user.id,
          name: profile2?.full_name || user.email?.split("@")[0] || "Guest",
          role: "MEMBER",
          rsvp_status: status,
          rsvp_at: new Date(),
        },
      });
      console.log("[RSVP API] New member created:", newMember.id);
      return NextResponse.json(newMember, { status: 201 });
    }

    // Captain can't un-GOING themselves
    if (member.role === "CAPTAIN" && status !== "GOING") {
      console.log("[RSVP API] Captain tried to change from GOING — blocked");
      return NextResponse.json(
        { error: "The captain must stay as GOING" },
        { status: 400 }
      );
    }

    console.log("[RSVP API] Updating member", member.id, "status to", status);
    const updated = await prisma.tripMembers.update({
      where: { id: member.id },
      data: {
        rsvp_status: status,
        rsvp_at: new Date(),
      },
    });

    console.log("[RSVP API] Update successful");
    return NextResponse.json(updated);
  } catch (err) {
    console.error("[RSVP API] Error:", err);
    const message = err instanceof Error ? err.message : "Failed to update RSVP";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
