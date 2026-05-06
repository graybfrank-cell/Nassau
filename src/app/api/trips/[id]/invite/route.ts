import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser, getTripMembership, unauthorized, forbidden } from "@/lib/auth";
import crypto from "crypto";
import {
  sendEmail,
  FROM_PERSONAL,
  REPLY_TO_PERSONAL,
} from "@/lib/email";
import { renderInviteEmail } from "@/emails/InviteEmail";

function generateInviteCode(): string {
  return crypto.randomBytes(6).toString("base64url");
}

function generateShareCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.randomBytes(8);
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars[bytes[i] % chars.length];
  }
  return code;
}

// POST /api/trips/[id]/invite
// Body: { emails?: string[] }
// If emails provided, send email invites
// If no body, generate invite_code (legacy behavior)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user) return unauthorized();

  const { id } = await params;
  const membership = await getTripMembership(id, user.id);
  if (!membership) return forbidden();

  let body: { emails?: string[] } = {};
  try {
    body = await req.json();
  } catch {
    // No body — legacy invite code generation
  }

  // If emails provided, send email invites
  if (body.emails && body.emails.length > 0) {
    const trip = await prisma.trips.findUnique({
      where: { id },
      include: { members: true },
    });
    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }

    // Ensure trip has a share code
    let shareCode = trip.share_code;
    if (!shareCode) {
      shareCode = generateShareCode();
      await prisma.trips.update({
        where: { id },
        data: { share_code: shareCode },
      });
    }

    const results: { email: string; status: string }[] = [];

    for (const email of body.emails) {
      const trimmed = email.trim().toLowerCase();
      if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
        results.push({ email: trimmed, status: "invalid" });
        continue;
      }

      // Check if already a member (by email field or linked user email)
      const alreadyInvited = trip.members.some(
        (m: any) => m.email === trimmed
      );
      if (alreadyInvited) {
        results.push({ email: trimmed, status: "already_invited" });
        continue;
      }

      // Check if a user exists with this email
      const profile = await prisma.profiles.findFirst({
        where: { email: trimmed },
      });

      // Also check if that profile's user_id is already a member
      if (profile) {
        const existingByUser = trip.members.some(
          (m: any) => m.user_id === profile.id
        );
        if (existingByUser) {
          results.push({ email: trimmed, status: "already_invited" });
          continue;
        }
      }

      // Create member record
      await prisma.tripMembers.create({
        data: {
          trip_id: id,
          user_id: profile?.id || null,
          email: trimmed,
          name: profile?.full_name || trimmed.split("@")[0],
          role: "MEMBER",
          rsvp_status: "PENDING",
          invited_at: new Date(),
        },
      });

      // Fire-and-forget invite email — never block member creation on email failure
      try {
        const tripUrl = `https://nassau.golf/trip/${shareCode}`;
        const captainName = membership.name || "Your friend";

        await sendEmail({
          from: FROM_PERSONAL,
          replyTo: REPLY_TO_PERSONAL,
          to: trimmed,
          subject: `${captainName} invited you to ${trip.name}`,
          html: renderInviteEmail({
            captainName,
            tripName: trip.name,
            destination: trip.destination,
            startDate: trip.start_date,
            endDate: trip.end_date,
            tripUrl,
          }),
        });
      } catch {
        // Email send failure shouldn't block member creation
      }

      results.push({ email: trimmed, status: "invited" });
    }

    return NextResponse.json({ results });
  }

  // Legacy: generate invite code + ensure share_code exists
  const inviteCode = generateInviteCode();
  const shareCode = generateShareCode();

  const existingTrip = await prisma.trips.findUnique({
    where: { id },
    select: { share_code: true },
  });

  const updated = await prisma.trips.update({
    where: { id },
    data: {
      invite_code: inviteCode,
      ...(existingTrip && !existingTrip.share_code ? { share_code: shareCode } : {}),
    },
  });

  return NextResponse.json({
    inviteCode: updated.invite_code,
    shareCode: updated.share_code,
  });
}
