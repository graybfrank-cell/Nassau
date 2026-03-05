import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser, getTripMembership, unauthorized, forbidden } from "@/lib/auth";
import crypto from "crypto";
import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

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
        (m) => m.email === trimmed
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
          (m) => m.user_id === profile.id
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

      // Send invite email
      if (resend) {
        try {
          const tripUrl = `https://nassau.golf/trip/${shareCode}`;
          const captainName = membership.name || "Your friend";

          await resend.emails.send({
            from: "Grayson at Nassau <grayson@nassau.golf>",
            replyTo: "grayson@nassau.golf",
            to: trimmed,
            subject: `You're invited to ${trip.name}! \uD83C\uDFCC\uFE0F`,
            html: buildInviteEmail({
              captainName,
              tripName: trip.name,
              destination: trip.destination,
              startDate: trip.start_date,
              endDate: trip.end_date,
              groupSize: trip.group_size_target,
              tripUrl,
            }),
          });
        } catch {
          // Email send failure shouldn't block member creation
        }
      }

      results.push({ email: trimmed, status: "invited" });
    }

    return NextResponse.json({ results });
  }

  // Legacy: generate invite code
  const inviteCode = generateInviteCode();
  const updated = await prisma.trips.update({
    where: { id },
    data: { invite_code: inviteCode },
  });

  return NextResponse.json({ inviteCode: updated.invite_code });
}

function buildInviteEmail(data: {
  captainName: string;
  tripName: string;
  destination: string;
  startDate: string;
  endDate: string;
  groupSize: number | null;
  tripUrl: string;
}): string {
  const dates =
    data.startDate && data.endDate
      ? `${data.startDate} \u2014 ${data.endDate}`
      : data.startDate || data.endDate || "";

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border-radius:12px;overflow:hidden;">
        <tr>
          <td style="background:#059669;padding:24px 32px;text-align:center;">
            <span style="color:#ffffff;font-size:24px;font-weight:700;letter-spacing:1px;">NASSAU</span>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <p style="margin:0 0 16px;font-size:16px;color:#18181b;">
              <strong>${data.captainName}</strong> invited you to
            </p>
            <h1 style="margin:0 0 24px;font-size:24px;color:#18181b;">${data.tripName}</h1>
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;border-radius:8px;padding:16px;margin-bottom:24px;">
              <tr><td>
                ${data.destination ? `<p style="margin:0 0 8px;font-size:14px;color:#52525b;"><strong>Destination:</strong> ${data.destination}</p>` : ""}
                ${dates ? `<p style="margin:0 0 8px;font-size:14px;color:#52525b;"><strong>Dates:</strong> ${dates}</p>` : ""}
                ${data.groupSize ? `<p style="margin:0;font-size:14px;color:#52525b;"><strong>Group Size:</strong> ${data.groupSize} golfers</p>` : ""}
              </td></tr>
            </table>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr><td align="center">
                <a href="${data.tripUrl}" style="display:inline-block;background:#059669;color:#ffffff;padding:12px 32px;border-radius:8px;text-decoration:none;font-size:16px;font-weight:600;">
                  View Trip &amp; RSVP
                </a>
              </td></tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 32px;border-top:1px solid #e4e4e7;text-align:center;">
            <p style="margin:0;font-size:12px;color:#a1a1aa;">Nassau &mdash; The Golf Trip Companion</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
