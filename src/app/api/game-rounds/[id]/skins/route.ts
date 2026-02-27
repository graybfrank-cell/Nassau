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
    include: { players: true, scorecards: true, skins_game: true },
  });
  if (!round) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!round.players.some((p) => p.user_id === user.id)) return forbidden();
  if (!round.skins_game) {
    return NextResponse.json({ error: "No skins game" }, { status: 404 });
  }

  // Auto-calculate results from scorecards
  const confirmedPlayerIds = round.players
    .filter((p) => p.status === "confirmed" || p.role === "COMMISSIONER")
    .map((p) => p.id);
  const results = calculateSkinsResults(
    round.scorecards,
    confirmedPlayerIds,
    Number(round.skins_game.buy_in)
  );

  return NextResponse.json({
    ...round.skins_game,
    results,
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user) return unauthorized();

  const { id: roundId } = await params;

  const round = await prisma.gameRounds.findUnique({ where: { id: roundId } });
  if (!round) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (round.commissioner_id !== user.id) return forbidden();

  const body = await req.json();

  const skinsGame = await prisma.gameSkinsGames.upsert({
    where: { round_id: roundId },
    create: {
      round_id: roundId,
      buy_in: body.buy_in || 20,
    },
    update: {
      buy_in: body.buy_in || 20,
    },
  });

  return NextResponse.json(skinsGame);
}

interface ScorecardRow {
  player_id: string;
  holes: unknown;
}

function calculateSkinsResults(
  scorecards: ScorecardRow[],
  playerIds: string[],
  buyIn: number
) {
  const holes: { hole: number; winnerId: string | null; carryover: boolean }[] = [];
  const payouts: Record<string, number> = {};
  playerIds.forEach((id) => { payouts[id] = 0; });

  let carryover = 0;

  for (let i = 0; i < 18; i++) {
    const scores: { playerId: string; score: number }[] = [];

    for (const sc of scorecards) {
      if (!playerIds.includes(sc.player_id)) continue;
      const h = sc.holes as number[];
      if (h && h[i] && h[i] > 0) {
        scores.push({ playerId: sc.player_id, score: h[i] });
      }
    }

    if (scores.length === 0) {
      holes.push({ hole: i + 1, winnerId: null, carryover: false });
      continue;
    }

    const minScore = Math.min(...scores.map((s) => s.score));
    const winners = scores.filter((s) => s.score === minScore);

    if (winners.length === 1) {
      const winnerId = winners[0].playerId;
      const skinsValue = 1 + carryover;
      holes.push({ hole: i + 1, winnerId, carryover: false });
      payouts[winnerId] = (payouts[winnerId] || 0) + skinsValue * buyIn;
      carryover = 0;
    } else {
      carryover += 1;
      holes.push({ hole: i + 1, winnerId: null, carryover: true });
    }
  }

  return { holes, payouts };
}
