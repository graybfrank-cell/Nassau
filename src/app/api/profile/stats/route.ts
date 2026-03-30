import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser, unauthorized } from "@/lib/auth";

export async function GET() {
  const user = await getUser();
  if (!user) return unauthorized();

  // Count rounds played (game_players rows linked to this user)
  const players = await prisma.gamePlayers.findMany({
    where: { user_id: user.id },
    select: { id: true, round_id: true },
  });

  const rounds = players.length;

  // Get scorecards for those rounds to compute average score
  const playerIds = players.map((p: { id: string }) => p.id);

  let avgScore = 0;
  if (playerIds.length > 0) {
    const scorecards = await prisma.gameScorecards.findMany({
      where: { player_id: { in: playerIds }, total: { not: null } },
      select: { total: true },
    });

    if (scorecards.length > 0) {
      const sum = scorecards.reduce((acc: number, sc: { total: number | null }) => acc + (sc.total ?? 0), 0);
      avgScore = Math.round(sum / scorecards.length);
    }
  }

  // Count bets won (game settlements where this user is the payee / to_player)
  let betsWon = 0;
  if (playerIds.length > 0) {
    betsWon = await prisma.gameSettlements.count({
      where: { to_player: { in: playerIds } },
    });
  }

  return NextResponse.json({
    rounds,
    avgScore,
    avg_score: avgScore,
    won: betsWon,
    bets_won: betsWon,
  });
}
