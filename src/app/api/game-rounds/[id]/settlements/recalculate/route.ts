import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser, unauthorized, forbidden } from "@/lib/auth";
import { calculateNassauBet } from "@/components/shared/NassauBetCalculator";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user) return unauthorized();

  const { id: roundId } = await params;

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
  if (round.commissioner_id !== user.id) return forbidden();

  const confirmedPlayerIds = round.players
    .filter((p: any) => p.status === "confirmed" || p.role === "COMMISSIONER")
    .map((p: any) => p.id);

  // 1. Calculate expense balances
  const balances: Record<string, number> = {};
  confirmedPlayerIds.forEach((id: any) => {
    balances[id] = 0;
  });

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

  // 2. Calculate skins payouts
  if (round.skins_game) {
    const buyIn = Number(round.skins_game.buy_in);
    const holeOrder = round.starting_hole === 10
      ? [...Array.from({ length: 9 }, (_, i) => i + 9), ...Array.from({ length: 9 }, (_, i) => i)]
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

        // Each other player pays into the pot
        const losers = confirmedPlayerIds.filter((id: any) => id !== winnerId);
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

  // 3. Calculate nassau bet payouts
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

    // Store results on the nassau_bet record
    await prisma.gameNassauBets.update({
      where: { round_id: roundId },
      data: { results: nassauResults as object },
    });
  }

  // 4. Preserve settled settlements
  const settledMap = new Map<string, boolean>();
  for (const s of round.settlements) {
    if (s.settled) {
      settledMap.set(`${s.from_player}:${s.to_player}`, true);
    }
  }

  // 5. Delete unsettled settlements
  await prisma.gameSettlements.deleteMany({
    where: { round_id: roundId, settled: false },
  });

  // 6. Compute net settlements (minimize transactions)
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

  let i = 0,
    j = 0;
  while (i < debtors.length && j < creditors.length) {
    const payment = Math.min(debtors[i].amount, creditors[j].amount);
    if (payment > 0.01) {
      const key = `${debtors[i].id}:${creditors[j].id}`;
      if (!settledMap.has(key)) {
        newSettlements.push({
          from_player: debtors[i].id,
          to_player: creditors[j].id,
          amount: Math.round(payment * 100) / 100,
        });
      }
    }
    debtors[i].amount -= payment;
    creditors[j].amount -= payment;
    if (debtors[i].amount < 0.01) i++;
    if (creditors[j].amount < 0.01) j++;
  }

  // 7. Create new settlement records
  if (newSettlements.length > 0) {
    await prisma.gameSettlements.createMany({
      data: newSettlements.map((s: { from_player: string; to_player: string; amount: number }) => ({
        round_id: roundId,
        from_player: s.from_player,
        to_player: s.to_player,
        amount: s.amount,
        reason: "combined",
      })),
    });
  }

  const allSettlements = await prisma.gameSettlements.findMany({
    where: { round_id: roundId },
    orderBy: { created_at: "asc" },
  });

  return NextResponse.json(allSettlements);
}
