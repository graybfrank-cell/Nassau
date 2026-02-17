import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const tripId = req.nextUrl.searchParams.get("tripId");
  if (!tripId) {
    return NextResponse.json({ error: "tripId required" }, { status: 400 });
  }
  const games = await prisma.skinsGame.findMany({
    where: { tripId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(games);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const game = await prisma.skinsGame.create({
    data: {
      tripId: body.tripId,
      name: body.name,
      players: body.players || [],
      stake: body.stake || 5,
      holes: body.holes || [],
    },
  });
  return NextResponse.json(game, { status: 201 });
}
