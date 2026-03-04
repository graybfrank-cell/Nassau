import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser, unauthorized, forbidden } from "@/lib/auth";
import { calculateNassauBet } from "@/components/shared/NassauBetCalculator";

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

  const scorecards = await prisma.gameScorecards.findMany({
    where: { round_id: roundId },
  });

  return NextResponse.json(scorecards);
}

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
  if (!round.players.some((p) => p.user_id === user.id)) return forbidden();

  const body = await req.json();
  const holes: number[] = body.holes || [];
  const frontNine = holes.slice(0, 9).reduce((a, b) => a + (b || 0), 0);
  const backNine = holes.slice(9, 18).reduce((a, b) => a + (b || 0), 0);
  const total = frontNine + backNine;

  const scorecard = await prisma.gameScorecards.upsert({
    where: {
      round_id_player_id: {
        round_id: roundId,
        player_id: body.player_id,
      },
    },
    create: {
      round_id: roundId,
      player_id: body.player_id,
      holes,
      total: total || null,
      front_nine: frontNine || null,
      back_nine: backNine || null,
    },
    update: {
      holes,
      total: total || null,
      front_nine: frontNine || null,
      back_nine: backNine || null,
    },
  });

  // Auto-transition round to in_progress if first scorecard entry
  if (round.status === "upcoming") {
    try {
      await prisma.gameRounds.update({
        where: { id: roundId },
        data: { status: "in_progress" },
      });
    } catch {
      // Non-critical — don't fail the scorecard save
    }
  }

  // Recalculate nassau bet results if one exists
  try {
    const nassauBet = await prisma.gameNassauBets.findUnique({
      where: { round_id: roundId },
    });
    if (nassauBet) {
      const allScorecards = await prisma.gameScorecards.findMany({
        where: { round_id: roundId },
      });
      const confirmedPlayerIds = round.players
        .filter((p) => p.status === "confirmed" || p.role === "COMMISSIONER")
        .map((p) => p.id);
      const nassauScorecards = allScorecards
        .filter((sc) => confirmedPlayerIds.includes(sc.player_id))
        .map((sc) => ({
          playerId: sc.player_id,
          holes: sc.holes as number[],
        }));
      const results = calculateNassauBet(
        nassauScorecards,
        confirmedPlayerIds,
        Number(nassauBet.bet_amount)
      );
      await prisma.gameNassauBets.update({
        where: { round_id: roundId },
        data: { results: results as object },
      });
    }
  } catch {
    // Table may not exist yet or recalculation failed — don't block scorecard save
  }

  return NextResponse.json(scorecard);
}
