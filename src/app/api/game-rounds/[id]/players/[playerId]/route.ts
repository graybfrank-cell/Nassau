import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser, unauthorized, forbidden } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; playerId: string }> }
) {
  const user = await getUser();
  if (!user) return unauthorized();

  const { id: roundId, playerId } = await params;

  const round = await prisma.gameRounds.findUnique({
    where: { id: roundId },
    include: { players: true },
  });
  if (!round) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const player = round.players.find((p) => p.id === playerId);
  if (!player) {
    return NextResponse.json({ error: "Player not found" }, { status: 404 });
  }

  // Commissioner can edit anyone; players can only update their own status
  const isCommissioner = round.commissioner_id === user.id;
  const isSelf = player.user_id === user.id;
  if (!isCommissioner && !isSelf) return forbidden();

  const body = await req.json();

  const updated = await prisma.gamePlayers.update({
    where: { id: playerId },
    data: {
      ...(body.status !== undefined && { status: body.status }),
      ...(body.name !== undefined && isCommissioner && { name: body.name }),
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; playerId: string }> }
) {
  const user = await getUser();
  if (!user) return unauthorized();

  const { id: roundId, playerId } = await params;

  const round = await prisma.gameRounds.findUnique({ where: { id: roundId } });
  if (!round) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (round.commissioner_id !== user.id) return forbidden();

  await prisma.gamePlayers.delete({ where: { id: playerId } });
  return NextResponse.json({ ok: true });
}
