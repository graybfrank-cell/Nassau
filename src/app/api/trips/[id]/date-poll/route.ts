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

// GET /api/trips/[id]/date-poll — get active or most recent poll
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user) return unauthorized();

  const { id: tripId } = await params;
  const membership = await getTripMembership(tripId, user.id);
  if (!membership) return forbidden();

  try {
    const poll = await prisma.datePolls.findFirst({
      where: { trip_id: tripId },
      orderBy: { created_at: "desc" },
      include: {
        options: { orderBy: { sort_order: "asc" } },
        votes: true,
      },
    });

    if (!poll) {
      return NextResponse.json({ poll: null });
    }

    // Build userVotes map: { optionId: "yes"|"maybe"|"no" }
    const userVotes: Record<string, string> = {};
    for (const v of poll.votes) {
      if (v.user_id === user.id) {
        userVotes[v.option_id] = v.vote;
      }
    }

    // Group votes by option
    const optionsWithVotes = poll.options.map((opt: any) => {
      const optionVotes = poll.votes.filter((v: any) => v.option_id === opt.id);
      return {
        ...opt,
        votes: optionVotes.map((v: any) => ({
          userId: v.user_id,
          vote: v.vote,
        })),
      };
    });

    return NextResponse.json({
      poll: {
        id: poll.id,
        tripId: poll.trip_id,
        createdBy: poll.created_by,
        status: poll.status,
        deadline: poll.deadline,
        createdAt: poll.created_at,
        closedAt: poll.closed_at,
        lockedOptionId: poll.locked_option_id,
      },
      options: optionsWithVotes,
      userVotes,
    });
  } catch {
    // Date poll tables not yet provisioned — return empty state
    return NextResponse.json({ poll: null, options: [], userVotes: {} });
  }
}

// POST /api/trips/[id]/date-poll — create a new poll
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
  const options: { start_date: string; end_date: string; label?: string }[] = body.options;

  if (!options || options.length < 2) {
    return NextResponse.json({ error: "At least 2 date options required" }, { status: 400 });
  }

  try {
    // Close any existing active polls
    await prisma.datePolls.updateMany({
      where: { trip_id: tripId, status: "active" },
      data: { status: "closed", closed_at: new Date() },
    });

    const deadline = new Date();
    deadline.setHours(deadline.getHours() + 72);

    const poll = await prisma.datePolls.create({
      data: {
        trip_id: tripId,
        created_by: user.id,
        status: "active",
        deadline,
        options: {
          create: options.map((opt, i) => ({
            start_date: new Date(opt.start_date + "T12:00:00Z"),
            end_date: new Date(opt.end_date + "T12:00:00Z"),
            label: opt.label || null,
            sort_order: i,
          })),
        },
      },
      include: { options: { orderBy: { sort_order: "asc" } } },
    });

    // Ensure trip has share code for the poll link
    const trip = await prisma.trips.findUnique({ where: { id: tripId } });
    let shareCode = trip?.share_code;
    if (!shareCode) {
      shareCode = generateShareCode();
      await prisma.trips.update({
        where: { id: tripId },
        data: { share_code: shareCode },
      });
    }

    // Send notification emails to all trip members
    if (resend && trip) {
      const members = await prisma.tripMembers.findMany({
        where: {
          trip_id: tripId,
          rsvp_status: { in: ["GOING", "PENDING"] },
          email: { not: null },
        },
      });

      const captainName = membership.name || "Your trip captain";
      const tripUrl = `https://nassau.golf/trip/${shareCode}`;
      const durationNights = body.duration_nights || 3;

      const optionLines = poll.options.map((opt: any, i: any) => {
        const letter = String.fromCharCode(65 + i);
        const start = new Date(opt.start_date);
        const end = new Date(opt.end_date);
        const startStr = start.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        const endStr = end.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        return `Option ${letter}: ${startStr}-${endStr} (${durationNights} night${durationNights !== 1 ? "s" : ""})${opt.label ? ` — "${opt.label}"` : ""}`;
      });

      const deadlineStr = deadline.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });

      for (const member of members) {
        if (!member.email || member.user_id === user.id) continue;
        try {
          await resend.emails.send({
            from: "Nassau <noreply@nassau.golf>",
            to: member.email,
            subject: `📅 Vote on dates for ${trip.name}!`,
            html: buildPollEmail({
              captainName,
              tripName: trip.name,
              destination: trip.destination,
              options: optionLines,
              deadline: deadlineStr,
              tripUrl,
            }),
          });
        } catch {
          // Don't block on email failure
        }
      }
    }

    return NextResponse.json({ poll, shareCode }, { status: 201 });
  } catch {
    // Date poll tables not yet provisioned
    return NextResponse.json({ error: "Date poll feature not yet available" }, { status: 422 });
  }
}

function buildPollEmail(data: {
  captainName: string;
  tripName: string;
  destination: string;
  options: string[];
  deadline: string;
  tripUrl: string;
}): string {
  const optionRows = data.options
    .map(
      (opt) =>
        `<tr><td style="padding:8px 12px;border-bottom:1px solid #e4e4e7;font-size:14px;color:#18181b;">${opt}</td></tr>`
    )
    .join("");

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
              <strong>${data.captainName}</strong> needs your help picking dates for
            </p>
            <h1 style="margin:0 0 8px;font-size:24px;color:#18181b;">${data.tripName}</h1>
            ${data.destination ? `<p style="margin:0 0 24px;font-size:14px;color:#71717a;">📍 ${data.destination}</p>` : '<div style="height:16px"></div>'}
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;border-radius:8px;overflow:hidden;margin-bottom:16px;">
              ${optionRows}
            </table>
            <p style="margin:0 0 24px;font-size:13px;color:#a1a1aa;">
              Vote by ${data.deadline}
            </p>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr><td align="center">
                <a href="${data.tripUrl}" style="display:inline-block;background:#059669;color:#ffffff;padding:12px 32px;border-radius:8px;text-decoration:none;font-size:16px;font-weight:600;">
                  Vote Now →
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
