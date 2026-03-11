import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser, unauthorized } from "@/lib/auth";

export async function GET() {
  const user = await getUser();
  if (!user) return unauthorized();

  const userId = user.id;

  // --- Profile ---
  const profile = await prisma.profiles.findUnique({
    where: { id: userId },
  });
  const fullName = profile?.full_name || user.email?.split("@")[0] || "Golfer";
  const firstName = fullName.split(" ")[0];
  const venmoUsername = profile?.venmo_username ?? null;

  // --- Upcoming Round ---
  const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000);

  const upcomingRoundRaw = await prisma.gameRounds.findFirst({
    where: {
      players: { some: { user_id: userId } },
      status: { in: ["upcoming", "in_progress"] },
      tee_time: { gt: fourHoursAgo },
    },
    orderBy: { tee_time: "asc" },
    include: {
      players: {
        select: { id: true, name: true, user_id: true },
      },
    },
  });

  const upcomingRound = upcomingRoundRaw
    ? {
        id: upcomingRoundRaw.id,
        courseName: upcomingRoundRaw.course_name,
        coursePhotoUrl: upcomingRoundRaw.course_photo_url ?? null,
        courseLocation: upcomingRoundRaw.course_location ?? null,
        teeTime: upcomingRoundRaw.tee_time.toISOString(),
        weather: upcomingRoundRaw.weather_data ?? null,
        players: upcomingRoundRaw.players.map((p) => ({
          id: p.id,
          name: p.name,
          avatarUrl: null as string | null,
        })),
      }
    : null;

  // --- Recent Scores ---
  // Find last 5 completed rounds where this user has a scorecard with total > 0
  const myPlayers = await prisma.gamePlayers.findMany({
    where: { user_id: userId },
    select: { id: true, round_id: true, is_personal_best: true },
  });
  const playerIdsByRound = new Map<string, { playerId: string; isPersonalBest: boolean }>();
  for (const p of myPlayers) {
    playerIdsByRound.set(p.round_id, { playerId: p.id, isPersonalBest: p.is_personal_best });
  }
  const roundIds = myPlayers.map((p) => p.round_id);

  // Get scorecards for these player IDs
  const playerIds = myPlayers.map((p) => p.id);
  const scorecards = await prisma.gameScorecards.findMany({
    where: {
      player_id: { in: playerIds },
      total: { gt: 0 },
    },
    select: { round_id: true, player_id: true, total: true },
  });
  const scorecardByRound = new Map<string, number>();
  for (const sc of scorecards) {
    scorecardByRound.set(sc.round_id, sc.total!);
  }

  // Get the rounds that have scorecards
  const roundsWithScores = scorecards.map((sc) => sc.round_id);
  const recentRoundsRaw = await prisma.gameRounds.findMany({
    where: {
      id: { in: roundsWithScores },
    },
    orderBy: { tee_time: "desc" },
    take: 5,
    select: {
      id: true,
      course_name: true,
      tee_time: true,
    },
  });

  // Get settlements for these rounds to compute moneyNet
  const recentRoundIds = recentRoundsRaw.map((r) => r.id);
  const roundSettlements = await prisma.gameSettlements.findMany({
    where: {
      round_id: { in: recentRoundIds },
    },
    select: { round_id: true, from_player: true, to_player: true, amount: true },
  });

  const recentScores = recentRoundsRaw.map((round) => {
    const playerInfo = playerIdsByRound.get(round.id);
    const playerId = playerInfo?.playerId;
    const score = scorecardByRound.get(round.id) ?? 0;

    // Calculate moneyNet for this round: money received - money paid
    let moneyNet = 0;
    for (const s of roundSettlements) {
      if (s.round_id !== round.id) continue;
      if (s.to_player === playerId) moneyNet += Number(s.amount);
      if (s.from_player === playerId) moneyNet -= Number(s.amount);
    }

    return {
      roundId: round.id,
      courseName: round.course_name,
      score,
      par: null as number | null,
      moneyNet: Math.round(moneyNet * 100) / 100,
      date: round.tee_time.toISOString(),
      isPersonalBest: playerInfo?.isPersonalBest ?? false,
    };
  });

  // --- Settlements ---
  // 1. GameSettlements (unsettled) where user is involved
  const unsettledGameSettlements = await prisma.gameSettlements.findMany({
    where: {
      settled: false,
      OR: [
        { from_player: { in: playerIds } },
        { to_player: { in: playerIds } },
      ],
    },
    select: {
      id: true,
      round_id: true,
      from_player: true,
      to_player: true,
      amount: true,
      reason: true,
    },
  });

  // Resolve player names for game settlements
  const allPlayerIdsInSettlements = new Set<string>();
  for (const s of unsettledGameSettlements) {
    allPlayerIdsInSettlements.add(s.from_player);
    allPlayerIdsInSettlements.add(s.to_player);
  }
  const settlementPlayers = await prisma.gamePlayers.findMany({
    where: { id: { in: Array.from(allPlayerIdsInSettlements) } },
    select: { id: true, name: true, user_id: true },
  });
  const playerNameMap = new Map<string, string>();
  const playerUserIdMap = new Map<string, string | null>();
  for (const p of settlementPlayers) {
    playerNameMap.set(p.id, p.name);
    playerUserIdMap.set(p.id, p.user_id);
  }

  // Determine which player IDs belong to the current user
  const myPlayerIdSet = new Set(playerIds);

  const gameOwed: { fromUser: string; amount: number; roundNote: string | null }[] = [];
  const gameOwing: { toUser: string; amount: number; roundNote: string | null }[] = [];

  for (const s of unsettledGameSettlements) {
    const amt = Number(s.amount);
    if (myPlayerIdSet.has(s.to_player)) {
      // Someone owes me
      gameOwed.push({
        fromUser: playerNameMap.get(s.from_player) || "Unknown",
        amount: amt,
        roundNote: s.reason || null,
      });
    }
    if (myPlayerIdSet.has(s.from_player)) {
      // I owe someone
      gameOwing.push({
        toUser: playerNameMap.get(s.to_player) || "Unknown",
        amount: amt,
        roundNote: s.reason || null,
      });
    }
  }

  // 2. Settlements table (user-level, pending)
  const pendingSettlements = await prisma.settlements.findMany({
    where: {
      status: "pending",
      OR: [
        { payer_id: userId },
        { payee_id: userId },
      ],
    },
    include: {
      payer: { select: { full_name: true } },
      payee: { select: { full_name: true } },
    },
  });

  for (const s of pendingSettlements) {
    const amt = Number(s.amount);
    if (s.payee_id === userId) {
      // Someone owes me (they are the payer)
      gameOwed.push({
        fromUser: s.payer.full_name || "Unknown",
        amount: amt,
        roundNote: s.note || null,
      });
    }
    if (s.payer_id === userId) {
      // I owe someone (payee)
      gameOwing.push({
        toUser: s.payee.full_name || "Unknown",
        amount: amt,
        roundNote: s.note || null,
      });
    }
  }

  const totalOwed = Math.round(gameOwed.reduce((sum, s) => sum + s.amount, 0) * 100) / 100;
  const totalOwing = Math.round(gameOwing.reduce((sum, s) => sum + s.amount, 0) * 100) / 100;

  // --- Season Stats ---
  const now = new Date();
  const yearStart = new Date(now.getFullYear(), 0, 1);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  // Completed rounds this year where user is a player
  const completedRoundsThisYear = await prisma.gameRounds.findMany({
    where: {
      status: "completed",
      tee_time: { gte: yearStart },
      players: { some: { user_id: userId } },
    },
    select: { id: true, tee_time: true },
  });

  const completedRoundIds = completedRoundsThisYear.map((r) => r.id);

  // totalMoneyNet from all completed round settlements this year
  const yearSettlements = await prisma.gameSettlements.findMany({
    where: {
      round_id: { in: completedRoundIds },
    },
    select: { from_player: true, to_player: true, amount: true, round_id: true },
  });

  // Build set of my player IDs for these rounds
  const myPlayersInCompletedRounds = await prisma.gamePlayers.findMany({
    where: {
      round_id: { in: completedRoundIds },
      user_id: userId,
    },
    select: { id: true, round_id: true },
  });
  const myCompletedPlayerIds = new Set(myPlayersInCompletedRounds.map((p) => p.id));

  let totalMoneyNet = 0;
  for (const s of yearSettlements) {
    const amt = Number(s.amount);
    if (myCompletedPlayerIds.has(s.to_player)) totalMoneyNet += amt;
    if (myCompletedPlayerIds.has(s.from_player)) totalMoneyNet -= amt;
  }
  totalMoneyNet = Math.round(totalMoneyNet * 100) / 100;

  // Rounds this month
  const roundsThisMonth = completedRoundsThisYear.filter(
    (r) => r.tee_time >= monthStart
  ).length;

  // Scoring average this year
  const yearPlayerIds = myPlayersInCompletedRounds.map((p) => p.id);
  const yearScorecards = await prisma.gameScorecards.findMany({
    where: {
      player_id: { in: yearPlayerIds },
      total: { gt: 0 },
    },
    select: { total: true },
  });

  let scoringAvg: number | null = null;
  if (yearScorecards.length > 0) {
    const sum = yearScorecards.reduce((acc, sc) => acc + (sc.total ?? 0), 0);
    scoringAvg = Math.round((sum / yearScorecards.length) * 10) / 10;
  }

  return NextResponse.json({
    user: { firstName, venmoUsername },
    upcomingRound,
    recentScores,
    settlements: {
      owed: gameOwed,
      owing: gameOwing,
      totalOwed,
      totalOwing,
    },
    seasonStats: {
      totalMoneyNet,
      roundsThisMonth,
      scoringAvg,
    },
  });
}
