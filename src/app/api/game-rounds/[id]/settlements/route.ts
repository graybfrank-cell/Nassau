import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser, unauthorized, forbidden } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
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
  if (!round.players.some((p) => p.user_id === user.id)) return forbidden();

  const settlements = await prisma.gameSettlements.findMany({
    where: { round_id: roundId },
    orderBy: { created_at: "asc" },
  });

  return NextResponse.json(settlements);
}
