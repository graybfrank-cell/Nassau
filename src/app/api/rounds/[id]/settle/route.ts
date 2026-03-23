import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser, unauthorized, forbidden } from "@/lib/auth";

interface SettleRequestBody {
  settlementId: string;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user) return unauthorized();

  const { id: roundId } = await params;

  const body: unknown = await req.json();
  if (
    !body ||
    typeof body !== "object" ||
    !("settlementId" in body) ||
    typeof (body as SettleRequestBody).settlementId !== "string"
  ) {
    return NextResponse.json(
      { error: "settlementId is required" },
      { status: 400 }
    );
  }

  const { settlementId } = body as SettleRequestBody;

  // Fetch settlement and verify it belongs to this round
  const settlement = await prisma.gameSettlements.findUnique({
    where: { id: settlementId },
  });

  if (!settlement || settlement.round_id !== roundId) {
    return NextResponse.json({ error: "Settlement not found" }, { status: 404 });
  }

  // Fetch the round with players to verify authorization
  const round = await prisma.gameRounds.findUnique({
    where: { id: roundId },
    include: { players: true },
  });

  if (!round) {
    return NextResponse.json({ error: "Round not found" }, { status: 404 });
  }

  // Verify user is the payer (from_player) or payee (to_player)
  const fromPlayerRecord = round.players.find(
    (p: { id: string; user_id: string | null }) => p.id === settlement.from_player
  );
  const toPlayerRecord = round.players.find(
    (p: { id: string; user_id: string | null }) => p.id === settlement.to_player
  );
  const isCommissioner = round.commissioner_id === user.id;
  const isPayer = fromPlayerRecord?.user_id === user.id;
  const isPayee = toPlayerRecord?.user_id === user.id;

  if (!isCommissioner && !isPayer && !isPayee) {
    return forbidden();
  }

  // Mark as settled
  const updated = await prisma.gameSettlements.update({
    where: { id: settlementId },
    data: {
      settled: true,
      settled_at: new Date(),
      settled_by: user.id,
    },
  });

  return NextResponse.json({ success: true, settlement: updated });
}
