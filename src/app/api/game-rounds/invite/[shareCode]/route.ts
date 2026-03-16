import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ shareCode: string }> }
) {
  const { shareCode } = await params;

  try {
    const round = await prisma.gameRounds.findUnique({
      where: { share_code: shareCode },
      include: {
        players: { select: { id: true, name: true, status: true, role: true } },
        skins_game: { select: { buy_in: true, results: true } },
        nassau_bet: { select: { bet_amount: true, results: true } },
        commissioner: { select: { full_name: true, email: true } },
        scorecards: { select: { player_id: true, holes: true, total: true } },
        settlements: {
          select: {
            from_player: true,
            to_player: true,
            amount: true,
            reason: true,
            settled: true,
          },
        },
        awards: true,
      },
    });

    if (!round) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Build scorecards map
    const scorecards = (round.scorecards ?? []).map((sc: any) => ({
      playerId: sc.player_id,
      holes: sc.holes ?? [],
      total: sc.total ?? 0,
    }));

    // Build settlements
    const settlements = (round.settlements ?? []).map((s: any) => ({
      fromPlayer: s.from_player,
      toPlayer: s.to_player,
      amount: Number(s.amount),
      reason: s.reason,
      settled: s.settled,
    }));

    return NextResponse.json({
      id: round.id,
      course_name: round.course_name,
      course_location: round.course_location,
      course_photo_url: round.course_photo_url,
      tee_time: round.tee_time,
      status: round.status,
      share_code: round.share_code,
      notes: round.notes,
      weather_data: round.weather_data,
      commissioner_name:
        round.commissioner.full_name ||
        round.commissioner.email?.split("@")[0] ||
        "Commissioner",
      players: round.players,
      scorecards,
      settlements,
      skins_buy_in: round.skins_game
        ? Number(round.skins_game.buy_in)
        : null,
      skins_results: round.skins_game?.results ?? null,
      nassau_bet_amount: round.nassau_bet
        ? Number(round.nassau_bet.bet_amount)
        : null,
      nassau_results: round.nassau_bet?.results ?? null,
      awards: round.awards ?? [],
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to load round" },
      { status: 500 }
    );
  }
}
