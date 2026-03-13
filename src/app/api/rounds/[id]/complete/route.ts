import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser, unauthorized, forbidden } from "@/lib/auth";
import { computeAwards } from "@/lib/round-awards";
import { calculateNassauBet } from "@/components/shared/NassauBetCalculator";

/* eslint-disable @typescript-eslint/no-explicit-any */

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user) return unauthorized();

  const { id: roundId } = await params;

  // 1. Load the round with all related data
  const round = await prisma.gameRounds.findUnique({
    where: { id: roundId },
    include: {
      players: true,
      scorecards: true,
      skins_game: true,
      nassau_bet: true,
      expenses: true,
      settlements: true,
    },
  });

  if (!round) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Verify user is the commissioner
  if (round.commissioner_id !== user.id) return forbidden();

  // 2. Update round status to "completed"
  await prisma.gameRounds.update({
    where: { id: roundId },
    data: { status: "completed" },
  });

  // 3. Recalculate settlements (inline, mirroring recalculate/route.ts logic)
  const confirmedPlayerIds = round.players
    .filter((p: any) => p.status === "confirmed" || p.role === "COMMISSIONER")
    .map((p: any) => p.id);

  const balances: Record<string, number> = {};
  confirmedPlayerIds.forEach((id: string) => {
    balances[id] = 0;
  });

  // Expense balances
  for (const expense of round.expenses) {
    const splitAmong = expense.split_among as string[];
    if (splitAmong.length === 0) continue;
    const splitAmount = Number(expense.amount) / splitAmong.length;
    balances[expense.paid_by] =
      (balances[expense.paid_by] || 0) + Number(expense.amount);
    for (const memberId of splitAmong) {
      balances[memberId] = (balances[memberId] || 0) - splitAmount;
    }
  }

  // Skins payouts
  if (round.skins_game) {
    const buyIn = Number(round.skins_game.buy_in);
    const holeOrder =
      round.starting_hole === 10
        ? [
            ...Array.from({ length: 9 }, (_, i) => i + 9),
            ...Array.from({ length: 9 }, (_, i) => i),
          ]
        : Array.from({ length: 18 }, (_, i) => i);
    let carryover = 0;

    for (let i = 0; i < 18; i++) {
      const idx = holeOrder[i];
      const scores: { playerId: string; score: number }[] = [];
      for (const sc of round.scorecards) {
        if (!confirmedPlayerIds.includes(sc.player_id)) continue;
        const holes = sc.holes as number[];
        if (holes && holes[idx] && holes[idx] > 0) {
          scores.push({ playerId: sc.player_id, score: holes[idx] });
        }
      }

      if (scores.length === 0) continue;

      const minScore = Math.min(...scores.map((s) => s.score));
      const winners = scores.filter((s) => s.score === minScore);

      if (winners.length === 1) {
        const winnerId = winners[0].playerId;
        const skinsValue = 1 + carryover;
        balances[winnerId] = (balances[winnerId] || 0) + skinsValue * buyIn;

        const losers = confirmedPlayerIds.filter((id: string) => id !== winnerId);
        const perLoser = (skinsValue * buyIn) / losers.length;
        for (const loserId of losers) {
          balances[loserId] = (balances[loserId] || 0) - perLoser;
        }
        carryover = 0;
      } else {
        carryover += 1;
      }
    }
  }

  // Nassau bet payouts
  if (round.nassau_bet) {
    const betAmount = Number(round.nassau_bet.bet_amount);
    const nassauScorecards = round.scorecards
      .filter((sc: any) => confirmedPlayerIds.includes(sc.player_id))
      .map((sc: any) => ({
        playerId: sc.player_id,
        holes: sc.holes as number[],
      }));
    const nassauResults = calculateNassauBet(
      nassauScorecards,
      confirmedPlayerIds,
      betAmount,
      round.starting_hole
    );
    for (const [playerId, net] of Object.entries(nassauResults.payouts)) {
      balances[playerId] = (balances[playerId] || 0) + (net as number);
    }

    await prisma.gameNassauBets.update({
      where: { round_id: roundId },
      data: { results: nassauResults as object },
    });
  }

  // Preserve settled settlements
  const settledMap = new Map<string, boolean>();
  for (const s of round.settlements) {
    if (s.settled) {
      settledMap.set(`${s.from_player}:${s.to_player}`, true);
    }
  }

  // Delete unsettled settlements
  await prisma.gameSettlements.deleteMany({
    where: { round_id: roundId, settled: false },
  });

  // Compute net settlements (minimize transactions)
  const debtors = Object.entries(balances)
    .filter(([, b]) => b < -0.01)
    .map(([id, b]) => ({ id, amount: -b }))
    .sort((a, b) => b.amount - a.amount);
  const creditors = Object.entries(balances)
    .filter(([, b]) => b > 0.01)
    .map(([id, b]) => ({ id, amount: b }))
    .sort((a, b) => b.amount - a.amount);

  const newSettlements: {
    from_player: string;
    to_player: string;
    amount: number;
  }[] = [];

  let di = 0,
    ci = 0;
  while (di < debtors.length && ci < creditors.length) {
    const payment = Math.min(debtors[di].amount, creditors[ci].amount);
    if (payment > 0.01) {
      const key = `${debtors[di].id}:${creditors[ci].id}`;
      if (!settledMap.has(key)) {
        newSettlements.push({
          from_player: debtors[di].id,
          to_player: creditors[ci].id,
          amount: Math.round(payment * 100) / 100,
        });
      }
    }
    debtors[di].amount -= payment;
    creditors[ci].amount -= payment;
    if (debtors[di].amount < 0.01) di++;
    if (creditors[ci].amount < 0.01) ci++;
  }

  if (newSettlements.length > 0) {
    await prisma.gameSettlements.createMany({
      data: newSettlements.map((s) => ({
        round_id: roundId,
        from_player: s.from_player,
        to_player: s.to_player,
        amount: s.amount,
        reason: "combined",
      })),
    });
  }

  // 4. Detect personal bests
  const playerMap = new Map<string, any>(round.players.map((p: any) => [p.id, p]));

  for (const scorecard of round.scorecards) {
    if (!scorecard.total || scorecard.total <= 0) continue;

    const player = playerMap.get(scorecard.player_id);
    if (!player?.user_id) continue;

    // Find previous rounds at the same course where this user played
    const previousScorecards = await prisma.gameScorecards.findMany({
      where: {
        round: {
          course_name: round.course_name,
          id: { not: roundId },
        },
        player_id: {
          in: (
            await prisma.gamePlayers.findMany({
              where: { user_id: player.user_id },
              select: { id: true },
            })
          ).map((p: { id: string }) => p.id),
        },
        total: { gt: 0 },
      },
      select: { total: true },
    });

    if (previousScorecards.length === 0) continue;

    const previousBest = Math.min(
      ...previousScorecards.map((sc: { total: number | null }) => sc.total!)
    );

    if (scorecard.total < previousBest) {
      await prisma.gamePlayers.update({
        where: { id: player.id },
        data: { is_personal_best: true },
      });
    }
  }

  // 5. Compute awards and store on game_rounds
  const allSettlements = await prisma.gameSettlements.findMany({
    where: { round_id: roundId },
  });

  const awards = computeAwards({
    players: round.players.map((p: any) => ({
      id: p.id,
      name: p.name,
      role: p.role,
    })),
    scorecards: round.scorecards.map((sc: any) => ({
      playerId: sc.player_id,
      holes: sc.holes as number[],
      total: sc.total ?? undefined,
      frontNine: sc.front_nine ?? undefined,
      backNine: sc.back_nine ?? undefined,
    })),
    skinsGame: round.skins_game
      ? {
          results: round.skins_game.results as
            | { payouts: Record<string, number> }
            | undefined,
        }
      : null,
    settlements: allSettlements.map((s: any) => ({
      fromPlayer: s.from_player,
      toPlayer: s.to_player,
      amount: Number(s.amount),
    })),
  });

  await prisma.gameRounds.update({
    where: { id: roundId },
    data: { awards: awards as object[] },
  });

  // 6. Create Settlement records (user-level, cross-round)
  const formattedDate = new Date(round.tee_time).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const settlementNote = `${round.course_name} — ${formattedDate}`;

  for (const gs of allSettlements) {
    if (gs.settled) continue;

    const payerPlayer = playerMap.get(gs.from_player);
    const payeePlayer = playerMap.get(gs.to_player);

    if (!payerPlayer?.user_id || !payeePlayer?.user_id) continue;

    // Avoid creating duplicate settlements
    const existing = await prisma.settlements.findFirst({
      where: {
        round_id: roundId,
        payer_id: payerPlayer.user_id,
        payee_id: payeePlayer.user_id,
      },
    });

    if (!existing) {
      await prisma.settlements.create({
        data: {
          round_id: roundId,
          payer_id: payerPlayer.user_id,
          payee_id: payeePlayer.user_id,
          amount: gs.amount,
          note: settlementNote,
          status: "pending",
        },
      });
    }
  }

  // 7. Return the updated round with awards
  const updatedRound = await prisma.gameRounds.findUnique({
    where: { id: roundId },
    include: {
      players: { orderBy: { joined_at: "asc" } },
      scorecards: true,
      skins_game: true,
      nassau_bet: true,
      expenses: { orderBy: { created_at: "desc" } },
      settlements: { orderBy: { created_at: "asc" } },
    },
  });

  return NextResponse.json(updatedRound);
}
