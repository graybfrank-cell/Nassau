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

  const body = await req.json();
  const teeTime = new Date(body.teeTime);

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
            status: "confirmed",
            role: "COMMISSIONER",
          },
          ...(body.players || []).map(
            (p: { name: string; email?: string }) => ({
              name: p.name,
              email: p.email || null,
              status: "invited" as const,
              role: "PLAYER" as const,
            })
          ),
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
}
