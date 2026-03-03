import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser, unauthorized } from "@/lib/auth";

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

    // Deduplicate players by email to avoid unique constraint violations
    const rawPlayers: { name: string; email?: string }[] = body.players || [];
    const seenEmails = new Set<string>();
    const dedupedPlayers = rawPlayers.filter((p) => {
      if (!p.email) return true;
      const lower = p.email.toLowerCase();
      if (seenEmails.has(lower)) return false;
      seenEmails.add(lower);
      return true;
    });

    const round = await prisma.gameRounds.create({
      data: {
        commissioner_id: user.id,
        course_name: body.courseName,
        course_id: body.courseId || null,
        course_location: body.courseLocation || null,
        course_lat: body.courseLat ?? null,
        course_lng: body.courseLng ?? null,
        tee_time: teeTime,
        notes: body.notes || null,
        players: {
          create: [
            {
              user_id: user.id,
              name: user.email?.split("@")[0] || "Commissioner",
              email: user.email || null,
              status: "confirmed",
              role: "COMMISSIONER",
            },
            ...dedupedPlayers.map((p) => ({
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
      },
      include: {
        players: true,
        scorecards: true,
        skins_game: true,
        expenses: true,
        settlements: true,
      },
    });

    return NextResponse.json(round, { status: 201 });
  } catch (err) {
    console.error("POST /api/game-rounds error:", err);
    const message =
      err instanceof Error ? err.message : "Failed to create round";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
