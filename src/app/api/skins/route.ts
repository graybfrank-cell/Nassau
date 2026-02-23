import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser, getTripMembership, unauthorized, forbidden } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getUser();
  if (!user) return unauthorized();

  const tripId = req.nextUrl.searchParams.get("tripId");
  if (!tripId) {
    return NextResponse.json({ error: "tripId required" }, { status: 400 });
  }

  const membership = await getTripMembership(tripId, user.id);
  if (!membership) return forbidden();

  const games = await prisma.skinsGames.findMany({
    where: { trip_id: tripId },
    orderBy: { created_at: "desc" },
  });
  return NextResponse.json(games);
}

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return unauthorized();

  const body = await req.json();
  const membership = await getTripMembership(body.tripId, user.id);
  if (!membership) return forbidden();

  const game = await prisma.skinsGames.create({
    data: {
      trip_id: body.tripId,
      name: body.name,
      buy_in: body.buyIn || 5,
      day_number: body.dayNumber || null,
      players: body.players || [],
      holes: body.holes || [],
    },
  });
  return NextResponse.json(game, { status: 201 });
}
