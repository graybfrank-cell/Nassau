import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser, unauthorized } from "@/lib/auth";

// ---------------------------------------------------------------------------
// Section fetchers — each is independently resilient
// ---------------------------------------------------------------------------

async function getProfile(userId: string, email?: string | null) {
  try {
    const profile = await prisma.profiles.findUnique({
      where: { id: userId },
    });
    const fullName = profile?.full_name || email?.split("@")[0] || "Golfer";
    return {
      data: {
        firstName: fullName.split(" ")[0],
        venmoUsername: profile?.venmo_username ?? null,
      },
      error: null,
    };
  } catch (error) {
    console.error("[Dashboard] Failed to fetch profile:", error);
    return {
      data: { firstName: "Golfer", venmoUsername: null as string | null },
      error: "Failed to load profile",
    };
  }
}

async function getUpcomingRound(userId: string) {
  try {
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

    const data = upcomingRoundRaw
      ? {
          id: upcomingRoundRaw.id,
          courseName: upcomingRoundRaw.course_name,
          coursePhotoUrl: upcomingRoundRaw.course_photo_url ?? null,
          courseLocation: upcomingRoundRaw.course_location ?? null,
          teeTime: upcomingRoundRaw.tee_time.toISOString(),
          weather: upcomingRoundRaw.weather_data ?? null,
          players: (upcomingRoundRaw.players ?? []).map((p: { id: string; name: string; user_id: string | null }) => ({
            id: p.id,
            name: p.name,
            avatarUrl: null as string | null,
          })),
        }
      : null;

    return { data, error: null };
  } catch (error) {
    console.error("[Dashboard] Failed to fetch upcoming round:", error);
    return { data: null, error: "Failed to load upcoming round" };
  }
}

async function getRecentScores(userId: string) {
  try {
    const myPlayers = await prisma.gamePlayers.findMany({
      where: { user_id: userId },
      select: { id: true, round_id: true, is_personal_best: true },
    });
    const playerIdsByRound = new Map<
      string,
      { playerId: string; isPersonalBest: boolean }
    >();
    for (const p of myPlayers) {
      playerIdsByRound.set(p.round_id, {
        playerId: p.id,
        isPersonalBest: p.is_personal_best,
      });
    }

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

    const roundsWithScores = scorecards.map((sc) => sc.round_id);
    const recentRoundsRaw = await prisma.gameRounds.findMany({
      where: { id: { in: roundsWithScores } },
      orderBy: { tee_time: "desc" },
      take: 5,
      select: { id: true, course_name: true, tee_time: true },
    });

    const recentRoundIds = recentRoundsRaw.map((r) => r.id);
    const roundSettlements = await prisma.gameSettlements.findMany({
      where: { round_id: { in: recentRoundIds } },
      select: {
        round_id: true,
        from_player: true,
        to_player: true,
        amount: true,
      },
    });

    const recentScores = recentRoundsRaw.map((round) => {
      const playerInfo = playerIdsByRound.get(round.id);
      const playerId = playerInfo?.playerId;
      const score = scorecardByRound.get(round.id) ?? 0;

      let moneyNet = 0;
      for (const s of roundSettlements) {
        if (s.round_id !== round.id) continue;
        if (s.to_player === playerId) moneyNet += Number(s.amount);
        if (s.from_player === playerId) moneyNet -= Number(s.amount);
      }

      return {
        roundId: round.id,
        courseName: round.course_name ?? "Unknown Course",
        score,
        par: null as number | null,
        moneyNet: Math.round(moneyNet * 100) / 100,
        date: round.tee_time?.toISOString() ?? new Date().toISOString(),
        isPersonalBest: playerInfo?.isPersonalBest ?? false,
      };
    });

    return { data: recentScores, error: null };
  } catch (error) {
    console.error("[Dashboard] Failed to fetch recent scores:", error);
    return { data: [] as never[], error: "Failed to load recent scores" };
  }
}

async function getSettlements(userId: string) {
  const empty = {
    owed: [] as { fromUser: string; amount: number; roundNote: string | null }[],
    owing: [] as { toUser: string; amount: number; roundNote: string | null }[],
    totalOwed: 0,
    totalOwing: 0,
  };

  try {
    // Get all player IDs for this user
    const myPlayers = await prisma.gamePlayers.findMany({
      where: { user_id: userId },
      select: { id: true },
    });
    const playerIds = myPlayers.map((p) => p.id);
    const myPlayerIdSet = new Set(playerIds);

    // Game-level unsettled settlements
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

    // Resolve player names
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
    for (const p of settlementPlayers) {
      playerNameMap.set(p.id, p.name);
    }

    const gameOwed: typeof empty.owed = [];
    const gameOwing: typeof empty.owing = [];

    for (const s of unsettledGameSettlements) {
      const amt = Number(s.amount);
      if (myPlayerIdSet.has(s.to_player)) {
        gameOwed.push({
          fromUser: playerNameMap.get(s.from_player) || "Unknown",
          amount: amt,
          roundNote: s.reason || null,
        });
      }
      if (myPlayerIdSet.has(s.from_player)) {
        gameOwing.push({
          toUser: playerNameMap.get(s.to_player) || "Unknown",
          amount: amt,
          roundNote: s.reason || null,
        });
      }
    }

    // User-level pending settlements
    const pendingSettlements = await prisma.settlements.findMany({
      where: {
        status: "pending",
        OR: [{ payer_id: userId }, { payee_id: userId }],
      },
      include: {
        payer: { select: { full_name: true } },
        payee: { select: { full_name: true } },
      },
    });

    for (const s of pendingSettlements) {
      const amt = Number(s.amount);
      if (s.payee_id === userId) {
        gameOwed.push({
          fromUser: s.payer?.full_name || "Unknown",
          amount: amt,
          roundNote: s.note || null,
        });
      }
      if (s.payer_id === userId) {
        gameOwing.push({
          toUser: s.payee?.full_name || "Unknown",
          amount: amt,
          roundNote: s.note || null,
        });
      }
    }

    return {
      data: {
        owed: gameOwed,
        owing: gameOwing,
        totalOwed:
          Math.round(
            gameOwed.reduce((sum, s) => sum + s.amount, 0) * 100
          ) / 100,
        totalOwing:
          Math.round(
            gameOwing.reduce((sum, s) => sum + s.amount, 0) * 100
          ) / 100,
      },
      error: null,
    };
  } catch (error) {
    console.error("[Dashboard] Failed to fetch settlements:", error);
    return { data: empty, error: "Failed to load settlements" };
  }
}

async function getSeasonStats(userId: string) {
  const empty = {
    totalMoneyNet: 0,
    roundsThisMonth: 0,
    scoringAvg: null as number | null,
  };

  try {
    const now = new Date();
    const yearStart = new Date(now.getFullYear(), 0, 1);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const completedRoundsThisYear = await prisma.gameRounds.findMany({
      where: {
        status: "completed",
        tee_time: { gte: yearStart },
        players: { some: { user_id: userId } },
      },
      select: { id: true, tee_time: true },
    });

    const completedRoundIds = completedRoundsThisYear.map((r) => r.id);

    const yearSettlements = await prisma.gameSettlements.findMany({
      where: { round_id: { in: completedRoundIds } },
      select: {
        from_player: true,
        to_player: true,
        amount: true,
        round_id: true,
      },
    });

    const myPlayersInCompletedRounds = await prisma.gamePlayers.findMany({
      where: { round_id: { in: completedRoundIds }, user_id: userId },
      select: { id: true, round_id: true },
    });
    const myCompletedPlayerIds = new Set(
      myPlayersInCompletedRounds.map((p) => p.id)
    );

    let totalMoneyNet = 0;
    for (const s of yearSettlements) {
      const amt = Number(s.amount);
      if (myCompletedPlayerIds.has(s.to_player)) totalMoneyNet += amt;
      if (myCompletedPlayerIds.has(s.from_player)) totalMoneyNet -= amt;
    }
    totalMoneyNet = Math.round(totalMoneyNet * 100) / 100;

    const roundsThisMonth = completedRoundsThisYear.filter(
      (r) => r.tee_time && r.tee_time >= monthStart
    ).length;

    const yearPlayerIds = myPlayersInCompletedRounds.map((p) => p.id);
    const yearScorecards = await prisma.gameScorecards.findMany({
      where: { player_id: { in: yearPlayerIds }, total: { gt: 0 } },
      select: { total: true },
    });

    let scoringAvg: number | null = null;
    if (yearScorecards.length > 0) {
      const sum = yearScorecards.reduce(
        (acc, sc) => acc + (sc.total ?? 0),
        0
      );
      scoringAvg = Math.round((sum / yearScorecards.length) * 10) / 10;
    }

    return {
      data: { totalMoneyNet, roundsThisMonth, scoringAvg },
      error: null,
    };
  } catch (error) {
    console.error("[Dashboard] Failed to fetch season stats:", error);
    return { data: empty, error: "Failed to load stats" };
  }
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

export async function GET() {
  try {
    // Auth check — the ONE thing that can legitimately 401
    const user = await getUser();
    if (!user) return unauthorized();

    const userId = user.id;

    // Fetch all sections in parallel — each is independently safe
    const [profile, upcomingRound, recentScores, settlements, seasonStats] =
      await Promise.all([
        getProfile(userId, user.email),
        getUpcomingRound(userId),
        getRecentScores(userId),
        getSettlements(userId),
        getSeasonStats(userId),
      ]);

    // ALWAYS return 200 with whatever data we have
    const errors = [
      profile.error,
      upcomingRound.error,
      recentScores.error,
      settlements.error,
      seasonStats.error,
    ].filter(Boolean);

    return NextResponse.json({
      user: profile.data,
      upcomingRound: upcomingRound.data,
      recentScores: recentScores.data,
      settlements: settlements.data,
      seasonStats: seasonStats.data,
      ...(errors.length > 0 ? { _errors: errors } : {}),
    });
  } catch (error) {
    // Nuclear fallback — even if auth or Prisma connection fails
    console.error("[Dashboard] Critical error:", error);
    return NextResponse.json(
      {
        user: { firstName: "Golfer", venmoUsername: null },
        upcomingRound: null,
        recentScores: [],
        settlements: { owed: [], owing: [], totalOwed: 0, totalOwing: 0 },
        seasonStats: {
          totalMoneyNet: 0,
          roundsThisMonth: 0,
          scoringAvg: null,
        },
        _errors: ["Dashboard failed to load. Please try refreshing."],
      },
      { status: 200 }
    );
  }
}
