import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser, unauthorized, forbidden } from "@/lib/auth";

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

  return NextResponse.json(player, { status: 201 });
}
