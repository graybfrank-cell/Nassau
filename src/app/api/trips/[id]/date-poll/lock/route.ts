import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser, getTripMembership, unauthorized, forbidden } from "@/lib/auth";
import { Resend } from "resend";
import crypto from "crypto";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

function generateShareCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.randomBytes(8);
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars[bytes[i] % chars.length];
  }
  return code;
}

function generateICS(data: {
  tripName: string;
  destination: string;
  startDate: Date;
  endDate: Date;
  shareCode: string;
}): string {
  // DTSTART/DTEND as all-day events (DATE format)
  const formatDate = (d: Date) => {
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
    return `${y}${m}${day}`;
  };

  const uid = `nassau-${data.shareCode}-${Date.now()}@nassau.golf`;
  const now = new Date();
  const dtstamp = `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, "0")}${String(now.getUTCDate()).padStart(2, "0")}T${String(now.getUTCHours()).padStart(2, "0")}${String(now.getUTCMinutes()).padStart(2, "0")}${String(now.getUTCSeconds()).padStart(2, "0")}Z`;

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Nassau//Golf Trip//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART;VALUE=DATE:${formatDate(data.startDate)}`,
    `DTEND;VALUE=DATE:${formatDate(data.endDate)}`,
    `SUMMARY:${data.tripName} — Golf Trip`,
    `DESCRIPTION:Golf trip to ${data.destination} with your crew. View details: https://nassau.golf/trip/${data.shareCode}`,
    `LOCATION:${data.destination}`,
    `URL:https://nassau.golf/trip/${data.shareCode}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

// POST /api/trips/[id]/date-poll/lock
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user) return unauthorized();

  const { id: tripId } = await params;
  const membership = await getTripMembership(tripId, user.id);
  if (!membership || (membership.role !== "CAPTAIN" && membership.role !== "CO_CAPTAIN")) {
    return forbidden();
  }

  const body = await req.json();
  const optionId: string = body.option_id;

  if (!optionId) {
    return NextResponse.json({ error: "option_id required" }, { status: 400 });
  }

  // Find the poll and option
  const poll = await prisma.datePolls.findFirst({
    where: { trip_id: tripId, status: { in: ["active", "closed"] } },
    orderBy: { created_at: "desc" },
    include: { options: true },
  });

  if (!poll) {
    return NextResponse.json({ error: "No poll found" }, { status: 404 });
  }

  const option = poll.options.find((o: any) => o.id === optionId);
  if (!option) {
    return NextResponse.json({ error: "Option not found" }, { status: 404 });
  }

  // Lock the poll
  await prisma.datePolls.update({
    where: { id: poll.id },
    data: {
      status: "locked",
      locked_option_id: optionId,
      closed_at: new Date(),
    },
  });

  // Update trip dates
  const startDate = new Date(option.start_date).toISOString().split("T")[0];
  const endDate = new Date(option.end_date).toISOString().split("T")[0];

  const trip = await prisma.trips.update({
    where: { id: tripId },
    data: {
      start_date: startDate,
      end_date: endDate,
    },
  });

  // Ensure share code
  let shareCode = trip.share_code;
  if (!shareCode) {
    shareCode = generateShareCode();
    await prisma.trips.update({
      where: { id: tripId },
      data: { share_code: shareCode },
    });
  }

  // Generate .ics calendar file
  const icsContent = generateICS({
    tripName: trip.name,
    destination: trip.destination,
    startDate: new Date(option.start_date),
    endDate: new Date(option.end_date),
    shareCode,
  });

  // Send lock-in emails with .ics attachment
  if (resend) {
    const members = await prisma.tripMembers.findMany({
      where: {
        trip_id: tripId,
        rsvp_status: { in: ["GOING", "PENDING"] },
        email: { not: null },
      },
    });

    const captainName = membership.name || "Your trip captain";
    const tripUrl = `https://nassau.golf/trip/${shareCode}`;
    const startStr = new Date(option.start_date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    const endStr = new Date(option.end_date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    const nights = Math.round(
      (new Date(option.end_date).getTime() - new Date(option.start_date).getTime()) /
        (1000 * 60 * 60 * 24)
    );
    const goingCount = members.filter((m: any) => m.rsvp_status === "GOING").length;

    for (const member of members) {
      if (!member.email) continue;
      try {
        await resend.emails.send({
          from: "Nassau <noreply@nassau.golf>",
          to: member.email,
          subject: `🎉 Dates locked for ${trip.name}! ${startStr.replace(/, \d{4}$/, "")}-${endStr}`,
          html: buildLockEmail({
            captainName,
            tripName: trip.name,
            destination: trip.destination,
            dateRange: `${startStr} — ${endStr}`,
            nights,
            goingCount,
            tripUrl,
          }),
          attachments: [
            {
              filename: `${trip.name.replace(/[^a-zA-Z0-9]/g, "-")}.ics`,
              content: Buffer.from(icsContent).toString("base64"),
              contentType: "text/calendar",
            },
          ],
        });
      } catch {
        // Don't block on email failure
      }
    }
  }

  return NextResponse.json({
    success: true,
    tripDates: { start_date: startDate, end_date: endDate },
    ics: icsContent,
  });
}

function buildLockEmail(data: {
  captainName: string;
  tripName: string;
  destination: string;
  dateRange: string;
  nights: number;
  goingCount: number;
  tripUrl: string;
}): string {
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
            <p style="margin:0 0 8px;font-size:16px;color:#18181b;">
              <strong>${data.captainName}</strong> locked in the dates for
            </p>
            <h1 style="margin:0 0 24px;font-size:24px;color:#18181b;">${data.tripName}</h1>
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#ecfdf5;border:1px solid #a7f3d0;border-radius:8px;padding:16px;margin-bottom:24px;">
              <tr><td>
                <p style="margin:0 0 8px;font-size:14px;color:#065f46;">📅 <strong>${data.dateRange}</strong> (${data.nights} night${data.nights !== 1 ? "s" : ""})</p>
                ${data.destination ? `<p style="margin:0 0 8px;font-size:14px;color:#065f46;">📍 ${data.destination}</p>` : ""}
                <p style="margin:0;font-size:14px;color:#065f46;">👥 ${data.goingCount} people going</p>
              </td></tr>
            </table>
            <p style="margin:0 0 24px;font-size:13px;color:#71717a;">
              A calendar invite is attached — add it to your calendar so you don't forget!
            </p>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr><td align="center">
                <a href="${data.tripUrl}" style="display:inline-block;background:#059669;color:#ffffff;padding:12px 32px;border-radius:8px;text-decoration:none;font-size:16px;font-weight:600;">
                  View Trip →
                </a>
              </td></tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 32px;border-top:1px solid #e4e4e7;text-align:center;">
            <p style="margin:0;font-size:12px;color:#a1a1aa;">Nassau — The Golf Trip Companion</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
