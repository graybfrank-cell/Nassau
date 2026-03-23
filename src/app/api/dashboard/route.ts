import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser, unauthorized } from "@/lib/auth";
import type {
  LifetimeStats,
  RecentRoundDetail,
  HeadToHeadOpponent,
  CourseHistoryEntry,
  UpcomingRound,
  AwardCount,
} from "@/types/dashboard";

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
        fullName,
        firstName: fullName.split(" ")[0],
        venmoUsername: profile?.venmo_username ?? null,
      },
      error: null,
    };
  } catch (error) {
    console.error("[Dashboard] Failed to fetch profile:", error);
    return {
      data: { fullName: "Golfer", firstName: "Golfer", venmoUsername: null as string | null },
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

    const playerIds = myPlayers.map((p: { id: string }) => p.id);
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

    const roundsWithScores = scorecards.map((sc: { round_id: string }) => sc.round_id);
    const recentRoundsRaw = await prisma.gameRounds.findMany({
      where: { id: { in: roundsWithScores } },
      orderBy: { tee_time: "desc" },
      take: 5,
      select: { id: true, course_name: true, tee_time: true },
    });

    const recentRoundIds = recentRoundsRaw.map((r: { id: string }) => r.id);
    const roundSettlements = await prisma.gameSettlements.findMany({
      where: { round_id: { in: recentRoundIds } },
      select: {
        round_id: true,
        from_player: true,
        to_player: true,
        amount: true,
      },
    });

    const recentScores = recentRoundsRaw.map((round: { id: string; course_name: string | null; tee_time: Date | null }) => {
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
    const playerIds = myPlayers.map((p: { id: string }) => p.id);
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

    const completedRoundIds = completedRoundsThisYear.map((r: { id: string }) => r.id);

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
      myPlayersInCompletedRounds.map((p: { id: string }) => p.id)
    );

    let totalMoneyNet = 0;
    for (const s of yearSettlements) {
      const amt = Number(s.amount);
      if (myCompletedPlayerIds.has(s.to_player)) totalMoneyNet += amt;
      if (myCompletedPlayerIds.has(s.from_player)) totalMoneyNet -= amt;
    }
    totalMoneyNet = Math.round(totalMoneyNet * 100) / 100;

    const roundsThisMonth = completedRoundsThisYear.filter(
      (r: { id: string; tee_time: Date | null }) => r.tee_time && r.tee_time >= monthStart
    ).length;

    const yearPlayerIds = myPlayersInCompletedRounds.map((p: { id: string }) => p.id);
    const yearScorecards = await prisma.gameScorecards.findMany({
      where: { player_id: { in: yearPlayerIds }, total: { gt: 0 } },
      select: { total: true },
    });

    let scoringAvg: number | null = null;
    if (yearScorecards.length > 0) {
      const sum = yearScorecards.reduce(
        (acc: number, sc: { total: number | null }) => acc + (sc.total ?? 0),
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
// Lifetime stats
// ---------------------------------------------------------------------------

async function getLifetimeStats(userId: string) {
  const empty: LifetimeStats = {
    totalRounds: 0,
    allTimePnl: 0,
    bestScore: null,
    avgScore: null,
    totalSkinsWon: 0,
    totalMoneyWon: 0,
  };

  try {
    // Get all player records for this user
    const myPlayers = await prisma.gamePlayers.findMany({
      where: { user_id: userId },
      select: { id: true, round_id: true },
    });
    const playerIds = myPlayers.map((p: { id: string }) => p.id);
    const playerIdSet = new Set(playerIds);

    // Completed rounds
    const roundIds = myPlayers.map((p: { round_id: string }) => p.round_id);
    const completedRounds = await prisma.gameRounds.findMany({
      where: { id: { in: roundIds }, status: "completed" },
      select: { id: true, awards: true },
    });
    const totalRounds = completedRounds.length;
    const completedRoundIds = completedRounds.map((r: { id: string }) => r.id);

    // All scorecards
    const scorecards = await prisma.gameScorecards.findMany({
      where: { player_id: { in: playerIds }, total: { gt: 0 } },
      select: { total: true },
    });

    let bestScore: number | null = null;
    let avgScore: number | null = null;
    if (scorecards.length > 0) {
      const totals = scorecards.map((sc: { total: number | null }) => sc.total!);
      bestScore = Math.min(...totals);
      avgScore = Math.round((totals.reduce((a: number, b: number) => a + b, 0) / totals.length) * 10) / 10;
    }

    // All-time P&L
    const allSettlements = await prisma.gameSettlements.findMany({
      where: { round_id: { in: completedRoundIds } },
      select: { from_player: true, to_player: true, amount: true },
    });

    let allTimePnl = 0;
    let totalMoneyWon = 0;
    for (const s of allSettlements) {
      const amt = Number(s.amount);
      if (playerIdSet.has(s.to_player)) {
        allTimePnl += amt;
        totalMoneyWon += amt;
      }
      if (playerIdSet.has(s.from_player)) {
        allTimePnl -= amt;
      }
    }
    allTimePnl = Math.round(allTimePnl * 100) / 100;
    totalMoneyWon = Math.round(totalMoneyWon * 100) / 100;

    // Skins won
    const skinsGames = await prisma.gameSkinsGames.findMany({
      where: { round_id: { in: completedRoundIds } },
      select: { results: true },
    });

    let totalSkinsWon = 0;
    for (const sg of skinsGames) {
      if (!sg.results || !Array.isArray(sg.results)) continue;
      for (const result of sg.results as Array<{ winnerId?: string | null }>) {
        if (result.winnerId && playerIdSet.has(result.winnerId)) {
          totalSkinsWon++;
        }
      }
    }

    return {
      data: { totalRounds, allTimePnl, bestScore, avgScore, totalSkinsWon, totalMoneyWon },
      error: null,
    };
  } catch (error) {
    console.error("[Dashboard] Failed to fetch lifetime stats:", error);
    return { data: empty, error: "Failed to load lifetime stats" };
  }
}

// ---------------------------------------------------------------------------
// Recent rounds with details
// ---------------------------------------------------------------------------

async function getRecentRoundDetails(userId: string) {
  try {
    const myPlayers = await prisma.gamePlayers.findMany({
      where: { user_id: userId },
      select: { id: true, round_id: true },
    });
    const playerIdsByRound = new Map<string, string>();
    for (const p of myPlayers) {
      playerIdsByRound.set(p.round_id, p.id);
    }

    const playerIds = myPlayers.map((p: { id: string }) => p.id);
    const scorecards = await prisma.gameScorecards.findMany({
      where: { player_id: { in: playerIds }, total: { gt: 0 } },
      select: { round_id: true, total: true },
    });
    const scoreByRound = new Map<string, number>();
    for (const sc of scorecards) {
      scoreByRound.set(sc.round_id, sc.total!);
    }

    const roundsWithScores = scorecards.map((sc: { round_id: string }) => sc.round_id);
    const recentRounds = await prisma.gameRounds.findMany({
      where: { id: { in: roundsWithScores }, status: "completed" },
      orderBy: { tee_time: "desc" },
      take: 5,
      select: { id: true, course_name: true, tee_time: true, awards: true },
    });

    const recentRoundIds = recentRounds.map((r: { id: string }) => r.id);
    const settlements = await prisma.gameSettlements.findMany({
      where: { round_id: { in: recentRoundIds } },
      select: { round_id: true, from_player: true, to_player: true, amount: true },
    });

    const playerIdSet = new Set(playerIds);
    const results: RecentRoundDetail[] = recentRounds.map(
      (round: { id: string; course_name: string | null; tee_time: Date | null; awards: unknown }) => {
        const score = scoreByRound.get(round.id) ?? 0;

        let moneyNet = 0;
        for (const s of settlements) {
          if (s.round_id !== round.id) continue;
          if (playerIdSet.has(s.to_player)) moneyNet += Number(s.amount);
          if (playerIdSet.has(s.from_player)) moneyNet -= Number(s.amount);
        }

        // Extract awards for this player from the round
        const awards: string[] = [];
        if (round.awards && typeof round.awards === "object") {
          const playerId = playerIdsByRound.get(round.id);
          const awardsObj = round.awards as Record<string, unknown>;
          for (const [awardName, winnerIds] of Object.entries(awardsObj)) {
            if (Array.isArray(winnerIds) && playerId && winnerIds.includes(playerId)) {
              awards.push(awardName);
            }
          }
        }

        return {
          roundId: round.id,
          courseName: round.course_name ?? "Unknown Course",
          date: round.tee_time?.toISOString() ?? new Date().toISOString(),
          score,
          moneyNet: Math.round(moneyNet * 100) / 100,
          awards,
        };
      }
    );

    return { data: results, error: null };
  } catch (error) {
    console.error("[Dashboard] Failed to fetch recent round details:", error);
    return { data: [] as RecentRoundDetail[], error: "Failed to load recent rounds" };
  }
}

// ---------------------------------------------------------------------------
// Head-to-head
// ---------------------------------------------------------------------------

async function getHeadToHead(userId: string) {
  try {
    const myPlayers = await prisma.gamePlayers.findMany({
      where: { user_id: userId },
      select: { id: true, round_id: true },
    });
    const playerIds = myPlayers.map((p: { id: string }) => p.id);
    const playerIdSet = new Set(playerIds);
    const myRoundIds = myPlayers.map((p: { round_id: string }) => p.round_id);

    // Get all completed rounds the user was in
    const completedRounds = await prisma.gameRounds.findMany({
      where: { id: { in: myRoundIds }, status: "completed" },
      select: { id: true },
    });
    const completedRoundIds = completedRounds.map((r: { id: string }) => r.id);

    // Get all other players in those rounds
    const opponentPlayers = await prisma.gamePlayers.findMany({
      where: {
        round_id: { in: completedRoundIds },
        user_id: { not: userId },
      },
      select: { id: true, round_id: true, user_id: true, name: true },
    });

    // Count rounds per opponent and track names
    const opponentMap = new Map<string, { name: string; rounds: Set<string>; opponentPlayerIds: Set<string> }>();
    for (const op of opponentPlayers) {
      if (!op.user_id) continue;
      const existing = opponentMap.get(op.user_id);
      if (existing) {
        existing.rounds.add(op.round_id);
        existing.opponentPlayerIds.add(op.id);
      } else {
        opponentMap.set(op.user_id, {
          name: op.name,
          rounds: new Set([op.round_id]),
          opponentPlayerIds: new Set([op.id]),
        });
      }
    }

    // Get settlements to calculate W/L and money balance
    const allSettlements = await prisma.gameSettlements.findMany({
      where: { round_id: { in: completedRoundIds } },
      select: { round_id: true, from_player: true, to_player: true, amount: true },
    });

    const results: HeadToHeadOpponent[] = [];
    for (const [, info] of opponentMap) {
      let wins = 0;
      let losses = 0;
      let moneyBalance = 0;

      for (const s of allSettlements) {
        const isMyPlayer = playerIdSet.has(s.from_player) || playerIdSet.has(s.to_player);
        const isOpponent = info.opponentPlayerIds.has(s.from_player) || info.opponentPlayerIds.has(s.to_player);
        if (!isMyPlayer || !isOpponent) continue;

        const amt = Number(s.amount);
        if (playerIdSet.has(s.to_player) && info.opponentPlayerIds.has(s.from_player)) {
          moneyBalance += amt;
          wins++;
        }
        if (playerIdSet.has(s.from_player) && info.opponentPlayerIds.has(s.to_player)) {
          moneyBalance -= amt;
          losses++;
        }
      }

      results.push({
        opponentName: info.name,
        roundsTogether: info.rounds.size,
        wins,
        losses,
        moneyBalance: Math.round(moneyBalance * 100) / 100,
      });
    }

    // Sort by most rounds played together, take top 3
    results.sort((a, b) => b.roundsTogether - a.roundsTogether);
    return { data: results.slice(0, 3), error: null };
  } catch (error) {
    console.error("[Dashboard] Failed to fetch head-to-head:", error);
    return { data: [] as HeadToHeadOpponent[], error: "Failed to load rivalries" };
  }
}

// ---------------------------------------------------------------------------
// Course history
// ---------------------------------------------------------------------------

async function getCourseHistory(userId: string) {
  try {
    const myPlayers = await prisma.gamePlayers.findMany({
      where: { user_id: userId },
      select: { id: true, round_id: true },
    });
    const playerIds = myPlayers.map((p: { id: string }) => p.id);
    const myRoundIds = myPlayers.map((p: { round_id: string }) => p.round_id);

    const completedRounds = await prisma.gameRounds.findMany({
      where: { id: { in: myRoundIds }, status: "completed" },
      select: { id: true, course_name: true },
    });

    const scorecards = await prisma.gameScorecards.findMany({
      where: { player_id: { in: playerIds }, total: { gt: 0 } },
      select: { round_id: true, total: true },
    });
    const scoreByRound = new Map<string, number>();
    for (const sc of scorecards) {
      scoreByRound.set(sc.round_id, sc.total!);
    }

    // Group by course
    const courseMap = new Map<string, number[]>();
    for (const round of completedRounds) {
      const name = round.course_name || "Unknown Course";
      const score = scoreByRound.get(round.id);
      if (score === undefined) continue;
      const existing = courseMap.get(name);
      if (existing) {
        existing.push(score);
      } else {
        courseMap.set(name, [score]);
      }
    }

    const results: CourseHistoryEntry[] = [];
    for (const [courseName, scores] of courseMap) {
      results.push({
        courseName,
        timesPlayed: scores.length,
        bestScore: Math.min(...scores),
        avgScore: Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10,
      });
    }

    results.sort((a, b) => b.timesPlayed - a.timesPlayed);
    return { data: results.slice(0, 5), error: null };
  } catch (error) {
    console.error("[Dashboard] Failed to fetch course history:", error);
    return { data: [] as CourseHistoryEntry[], error: "Failed to load course history" };
  }
}

// ---------------------------------------------------------------------------
// Upcoming rounds (next 3)
// ---------------------------------------------------------------------------

async function getUpcomingRounds(userId: string) {
  try {
    const now = new Date();

    const rounds = await prisma.gameRounds.findMany({
      where: {
        players: { some: { user_id: userId } },
        status: "upcoming",
        tee_time: { gt: now },
      },
      orderBy: { tee_time: "asc" },
      take: 3,
      include: {
        players: {
          select: { id: true, name: true, user_id: true },
        },
      },
    });

    const data: UpcomingRound[] = rounds.map(
      (r: { id: string; course_name: string; course_photo_url: string | null; course_location: string | null; tee_time: Date; weather_data: unknown; players: Array<{ id: string; name: string; user_id: string | null }> }) => ({
        id: r.id,
        courseName: r.course_name,
        coursePhotoUrl: r.course_photo_url ?? null,
        courseLocation: r.course_location ?? null,
        teeTime: r.tee_time.toISOString(),
        weather: r.weather_data as UpcomingRound["weather"],
        players: r.players.map((p: { id: string; name: string }) => ({
          id: p.id,
          name: p.name,
          avatarUrl: null as string | null,
        })),
      })
    );

    return { data, error: null };
  } catch (error) {
    console.error("[Dashboard] Failed to fetch upcoming rounds:", error);
    return { data: [] as UpcomingRound[], error: "Failed to load upcoming rounds" };
  }
}

// ---------------------------------------------------------------------------
// Awards across all rounds
// ---------------------------------------------------------------------------

async function getAwards(userId: string) {
  try {
    const myPlayers = await prisma.gamePlayers.findMany({
      where: { user_id: userId },
      select: { id: true, round_id: true },
    });
    const playerIds = myPlayers.map((p: { id: string }) => p.id);
    const playerIdSet = new Set(playerIds);
    const myRoundIds = myPlayers.map((p: { round_id: string }) => p.round_id);

    const completedRounds = await prisma.gameRounds.findMany({
      where: { id: { in: myRoundIds }, status: "completed" },
      select: { id: true, awards: true },
    });

    const awardCounts = new Map<string, number>();
    for (const round of completedRounds) {
      if (!round.awards || typeof round.awards !== "object") continue;
      const awardsObj = round.awards as Record<string, unknown>;
      const playerId = myPlayers.find(
        (p: { round_id: string }) => p.round_id === round.id
      )?.id;
      if (!playerId) continue;

      for (const [awardName, winnerIds] of Object.entries(awardsObj)) {
        if (Array.isArray(winnerIds) && playerIdSet.has(playerId) && winnerIds.includes(playerId)) {
          awardCounts.set(awardName, (awardCounts.get(awardName) ?? 0) + 1);
        }
      }
    }

    const results: AwardCount[] = [];
    for (const [name, count] of awardCounts) {
      results.push({ name, count });
    }
    results.sort((a, b) => b.count - a.count);

    return { data: results, error: null };
  } catch (error) {
    console.error("[Dashboard] Failed to fetch awards:", error);
    return { data: [] as AwardCount[], error: "Failed to load awards" };
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
    const [
      profile,
      upcomingRound,
      recentScores,
      settlements,
      seasonStats,
      lifetimeStats,
      recentRoundDetails,
      headToHead,
      courseHistory,
      upcomingRoundsData,
      awardsData,
    ] = await Promise.all([
      getProfile(userId, user.email),
      getUpcomingRound(userId),
      getRecentScores(userId),
      getSettlements(userId),
      getSeasonStats(userId),
      getLifetimeStats(userId),
      getRecentRoundDetails(userId),
      getHeadToHead(userId),
      getCourseHistory(userId),
      getUpcomingRounds(userId),
      getAwards(userId),
    ]);

    // Check subscription status
    let subscriptionActive = false;
    try {
      const sub = await prisma.profiles.findUnique({
        where: { id: userId },
        select: { subscription_status: true, subscription_expires_at: true },
      });
      const activeStatuses = ["active", "trialing"];
      subscriptionActive =
        !!sub?.subscription_status &&
        activeStatuses.includes(sub.subscription_status) &&
        (!sub.subscription_expires_at || sub.subscription_expires_at > new Date());
    } catch {
      // Non-critical — default to false
    }

    // ALWAYS return 200 with whatever data we have
    const errors = [
      profile.error,
      upcomingRound.error,
      recentScores.error,
      settlements.error,
      seasonStats.error,
      lifetimeStats.error,
      recentRoundDetails.error,
      headToHead.error,
      courseHistory.error,
      upcomingRoundsData.error,
      awardsData.error,
    ].filter(Boolean);

    return NextResponse.json({
      user: profile.data,
      subscriptionActive,
      upcomingRound: upcomingRound.data,
      recentScores: recentScores.data,
      settlements: settlements.data,
      seasonStats: seasonStats.data,
      lifetimeStats: lifetimeStats.data,
      recentRounds: recentRoundDetails.data,
      headToHead: headToHead.data,
      courseHistory: courseHistory.data,
      upcomingRounds: upcomingRoundsData.data,
      awards: awardsData.data,
      ...(errors.length > 0 ? { _errors: errors } : {}),
    });
  } catch (error) {
    // Nuclear fallback — even if auth or Prisma connection fails
    console.error("[Dashboard] Critical error:", error);
    return NextResponse.json(
      {
        user: { fullName: "Golfer", firstName: "Golfer", venmoUsername: null },
        upcomingRound: null,
        recentScores: [],
        settlements: { owed: [], owing: [], totalOwed: 0, totalOwing: 0 },
        seasonStats: {
          totalMoneyNet: 0,
          roundsThisMonth: 0,
          scoringAvg: null,
        },
        lifetimeStats: {
          totalRounds: 0,
          allTimePnl: 0,
          bestScore: null,
          avgScore: null,
          totalSkinsWon: 0,
          totalMoneyWon: 0,
        },
        recentRounds: [],
        headToHead: [],
        courseHistory: [],
        upcomingRounds: [],
        awards: [],
        _errors: ["Dashboard failed to load. Please try refreshing."],
      },
      { status: 200 }
    );
  }
}
