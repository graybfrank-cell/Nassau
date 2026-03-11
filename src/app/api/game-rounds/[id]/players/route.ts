import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser, unauthorized, forbidden } from "@/lib/auth";
import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user) return unauthorized();

  const { id: roundId } = await params;

  const round = await prisma.gameRounds.findUnique({
    where: { id: roundId },
    include: { players: true },
  });
  if (!round) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (round.commissioner_id !== user.id) return forbidden();

  const body = await req.json();

  const player = await prisma.gamePlayers.create({
    data: {
      round_id: roundId,
      name: body.name,
      email: body.email || null,
      user_id: body.userId || null,
      status: "invited",
      role: "PLAYER",
    },
  });

  // Send invite email if player has an email
  if (resend && body.email) {
    try {
      const commName =
        user.user_metadata?.full_name ||
        user.email?.split("@")[0] ||
        "Your commissioner";
      const roundUrl = `https://nassau.golf/round/${round.share_code}`;
      const teeTime = new Date(round.tee_time);
      const dateStr = teeTime.toLocaleDateString("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
        year: "numeric",
      });
      const timeStr = teeTime.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      });

      await resend.emails.send({
        from: "Grayson at Nassau <grayson@nassau.golf>",
        replyTo: "grayson@nassau.golf",
        to: body.email.trim().toLowerCase(),
        subject: `\u26F3 You're invited to a round at ${round.course_name}`,
        html: `<!DOCTYPE html>
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
              <strong>${commName}</strong> invited you to a round
            </p>
            <h1 style="margin:0 0 24px;font-size:24px;color:#18181b;">\u26F3 ${round.course_name}</h1>
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;border-radius:8px;padding:16px;margin-bottom:24px;">
              <tr><td>
                <p style="margin:0 0 8px;font-size:14px;color:#52525b;"><strong>Date:</strong> ${dateStr}</p>
                <p style="margin:0 0 8px;font-size:14px;color:#52525b;"><strong>Tee Time:</strong> ${timeStr}</p>
                ${round.course_location ? `<p style="margin:0;font-size:14px;color:#52525b;"><strong>Location:</strong> ${round.course_location}</p>` : ""}
              </td></tr>
            </table>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr><td align="center">
                <a href="${roundUrl}" style="display:inline-block;background:#059669;color:#ffffff;padding:12px 32px;border-radius:8px;text-decoration:none;font-size:16px;font-weight:600;">
                  View Round &amp; Join
                </a>
              </td></tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 32px;border-top:1px solid #e4e4e7;text-align:center;">
            <p style="margin:0;font-size:12px;color:#a1a1aa;">Nassau &mdash; The Golf Companion</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
      });
    } catch {
      // Email send failure shouldn't block player creation
    }
  }

  return NextResponse.json(player, { status: 201 });
}
