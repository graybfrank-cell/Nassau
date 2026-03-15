import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { getUser, unauthorized } from "@/lib/auth";
import { Resend } from "resend";

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

export async function GET() {
  const user = await getUser();
  if (!user) return unauthorized();

  const rounds = await prisma.gameRounds.findMany({
    where: {
      players: { some: { user_id: user.id } },
    },
    include: {
      players: true,
      scorecards: true,
      skins_game: true,
      nassau_bet: true,
      expenses: true,
      settlements: true,
    },
    orderBy: { tee_time: "desc" },
  });

  return NextResponse.json(rounds);
}

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return unauthorized();

  try {
    const body = await req.json();

    if (!body.courseName || typeof body.courseName !== "string") {
      return NextResponse.json(
        { error: "Course name is required" },
        { status: 400 }
      );
    }

    const teeTime = new Date(body.teeTime);
    if (isNaN(teeTime.getTime())) {
      return NextResponse.json(
        { error: "Invalid tee time" },
        { status: 400 }
      );
    }

    // Deduplicate players by email and exclude the commissioner's own email
    // to avoid unique constraint violations (commissioner is auto-added)
    const rawPlayers: { name: string; email?: string }[] = body.players || [];
    const commEmail = user.email?.toLowerCase();
    const seenEmails = new Set<string>();
    if (commEmail) seenEmails.add(commEmail);
    const dedupedPlayers = rawPlayers.filter((p: { name: string; email?: string }) => {
      if (!p.email) return true;
      const lower = p.email.toLowerCase();
      if (seenEmails.has(lower)) return false;
      seenEmails.add(lower);
      return true;
    });

    const round = await prisma.gameRounds.create({
      data: {
        commissioner_id: user.id,
        share_code: generateShareCode(),
        course_name: body.courseName,
        course_id: body.courseId || null,
        course_location: body.courseLocation || null,
        course_layout: body.courseLayout || null,
        course_lat: body.courseLat ?? null,
        course_lng: body.courseLng ?? null,
        course_photo_url: body.coursePhotoUrl || null,
        course_address: body.courseAddress || null,
        tee_time: teeTime,
        notes: body.notes || null,
        starting_hole: body.startingHole === 10 ? 10 : 1,
        players: {
          create: [
            {
              user_id: user.id,
              name: user.email?.split("@")[0] || "Commissioner",
              email: user.email || null,
              status: "confirmed",
              role: "COMMISSIONER",
            },
            ...dedupedPlayers.map((p: { name: string; email?: string }) => ({
              name: p.name,
              email: p.email || null,
              status: "invited" as const,
              role: "PLAYER" as const,
            })),
          ],
        },
        ...(body.skinsGame
          ? {
              skins_game: {
                create: {
                  buy_in: body.skinsGame.buyIn || 20,
                },
              },
            }
          : {}),
        ...(body.nassauBet
          ? {
              nassau_bet: {
                create: {
                  bet_amount: body.nassauBet.betAmount || 10,
                },
              },
            }
          : {}),
      },
      include: {
        players: true,
        scorecards: true,
        skins_game: true,
        nassau_bet: true,
        expenses: true,
        settlements: true,
      },
    });

    // Send invite emails to players with email addresses
    if (resend) {
      const commName =
        user.user_metadata?.full_name ||
        user.email?.split("@")[0] ||
        "Your commissioner";
      const roundUrl = `https://nassau.golf/round/${round.share_code}`;

      for (const player of dedupedPlayers) {
        if (!player.email) continue;
        try {
          await resend.emails.send({
            from: "Grayson at Nassau <grayson@nassau.golf>",
            replyTo: "grayson@nassau.golf",
            to: player.email.trim().toLowerCase(),
            subject: `\u26F3 You're invited to a round at ${body.courseName}`,
            html: buildRoundInviteEmail({
              commissionerName: commName,
              courseName: body.courseName,
              courseLocation: body.courseLocation || null,
              teeTime,
              roundUrl,
            }),
          });
        } catch {
          // Email send failure shouldn't block round creation
        }
      }
    }

    return NextResponse.json(round, { status: 201 });
  } catch (err) {
    console.error("POST /api/game-rounds error:", err);
    const message =
      err instanceof Error ? err.message : "Failed to create round";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function buildRoundInviteEmail(data: {
  commissionerName: string;
  courseName: string;
  courseLocation: string | null;
  teeTime: Date;
  roundUrl: string;
}): string {
  const dateStr = data.teeTime.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const timeStr = data.teeTime.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

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
              <strong>${data.commissionerName}</strong> invited you to a round
            </p>
            <h1 style="margin:0 0 24px;font-size:24px;color:#18181b;">\u26F3 ${data.courseName}</h1>
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;border-radius:8px;padding:16px;margin-bottom:24px;">
              <tr><td>
                <p style="margin:0 0 8px;font-size:14px;color:#52525b;"><strong>Date:</strong> ${dateStr}</p>
                <p style="margin:0 0 8px;font-size:14px;color:#52525b;"><strong>Tee Time:</strong> ${timeStr}</p>
                ${data.courseLocation ? `<p style="margin:0;font-size:14px;color:#52525b;"><strong>Location:</strong> ${data.courseLocation}</p>` : ""}
              </td></tr>
            </table>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr><td align="center">
                <a href="${data.roundUrl}" style="display:inline-block;background:#059669;color:#ffffff;padding:12px 32px;border-radius:8px;text-decoration:none;font-size:16px;font-weight:600;">
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
</html>`;
}
