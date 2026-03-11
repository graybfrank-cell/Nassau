import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser, unauthorized, forbidden } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; settlementId: string }> }
) {
  const user = await getUser();
  if (!user) return unauthorized();

  const { id: roundId, settlementId } = await params;

  const round = await prisma.gameRounds.findUnique({
    where: { id: roundId },
    include: { players: true },
  });
  if (!round) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const settlement = await prisma.gameSettlements.findUnique({
    where: { id: settlementId },
  });
  if (!settlement || settlement.round_id !== roundId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Commissioner, from_player, or to_player can mark settlements
  const isCommissioner = round.commissioner_id === user.id;
  const fromPlayerRecord = round.players.find(
    (p: any) => p.id === settlement.from_player
  );
  const toPlayerRecord = round.players.find(
    (p: any) => p.id === settlement.to_player
  );
  const isParty =
    fromPlayerRecord?.user_id === user.id ||
    toPlayerRecord?.user_id === user.id;

  if (!isCommissioner && !isParty) return forbidden();

  const body = await req.json();

  const updated = await prisma.gameSettlements.update({
    where: { id: settlementId },
    data: {
      settled: body.settled,
      settled_at: body.settled ? new Date() : null,
      settled_by: body.settled ? user.id : null,
    },
  });

  return NextResponse.json(updated);
}
