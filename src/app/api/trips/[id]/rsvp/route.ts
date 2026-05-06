import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser, unauthorized } from "@/lib/auth";
import { ensureDbColumns } from "@/lib/auto-migrate";
import { sendEmail, FROM_PERSONAL, REPLY_TO_PERSONAL } from "@/lib/email";
import { renderRSVPNotification } from "@/emails/RSVPNotification";

type RSVPStatus = "GOING" | "MAYBE" | "DECLINED";

/**
 * Fire-and-forget: tell the captain that a crew member's RSVP changed.
 * Skips silently on any failure — never blocks the RSVP response.
 */
async function notifyCaptainOfRSVP(opts: {
  tripId: string;
  memberName: string;
  rsvpStatus: RSVPStatus;
}) {
  try {
    const trip = await prisma.trips.findUnique({
      where: { id: opts.tripId },
      include: {
        creator: { select: { email: true, full_name: true } },
        members: true,
      },
    });
    if (!trip) return;

    const captainEmail = trip.creator?.email;
    if (!captainEmail) return;

    const confirmedCount = trip.members.filter(
      (m: any) => m.rsvp_status === "GOING"
    ).length;
    const totalInvited = trip.members.length;

    const shareCode = (trip as any).share_code;
    const tripUrl = shareCode
      ? `https://nassau.golf/trip/${shareCode}`
      : `https://nassau.golf/trips/${trip.id}`;

    const subject =
      opts.rsvpStatus === "GOING"
        ? `${opts.memberName} is in for ${trip.name}`
        : opts.rsvpStatus === "MAYBE"
          ? `${opts.memberName} is a maybe for ${trip.name}`
          : `${opts.memberName} is out of ${trip.name}`;

    await sendEmail({
      from: FROM_PERSONAL,
      replyTo: REPLY_TO_PERSONAL,
      to: captainEmail,
      subject,
      html: renderRSVPNotification({
        memberName: opts.memberName,
        rsvpStatus: opts.rsvpStatus,
        tripName: trip.name,
        confirmedCount,
        totalInvited,
        tripUrl,
      }),
    });
  } catch (err) {
    console.error("[RSVP API] Captain notification failed:", err);
  }
}

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
          // Fire-and-forget captain notification (linking pre-invited member)
          if (emailMember.rsvp_status !== status) {
            notifyCaptainOfRSVP({
              tripId,
              memberName: updated.name || profile.full_name || profile.email,
              rsvpStatus: status as RSVPStatus,
            });
          }
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
      // Fire-and-forget captain notification (new RSVP via share link)
      notifyCaptainOfRSVP({
        tripId,
        memberName: newMember.name || "A crew member",
        rsvpStatus: status as RSVPStatus,
      });
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

    const previousStatus = member.rsvp_status;
    console.log("[RSVP API] Updating member", member.id, "status to", status);
    const updated = await prisma.tripMembers.update({
      where: { id: member.id },
      data: {
        rsvp_status: status,
        rsvp_at: new Date(),
      },
    });

    console.log("[RSVP API] Update successful");

    // Fire-and-forget captain notification — only if status actually changed,
    // and don't notify the captain about the captain's own RSVP.
    if (previousStatus !== status && member.role !== "CAPTAIN") {
      notifyCaptainOfRSVP({
        tripId,
        memberName: updated.name || "A crew member",
        rsvpStatus: status as RSVPStatus,
      });
    }

    return NextResponse.json(updated);
  } catch (err) {
    console.error("[RSVP API] Error:", err);
    const message = err instanceof Error ? err.message : "Failed to update RSVP";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
