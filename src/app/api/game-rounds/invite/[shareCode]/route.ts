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
        skins_game: { select: { buy_in: true } },
        nassau_bet: { select: { bet_amount: true } },
        commissioner: { select: { full_name: true, email: true } },
      },
    });

    if (!round) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: round.id,
      course_name: round.course_name,
      course_location: round.course_location,
      tee_time: round.tee_time,
      status: round.status,
      share_code: round.share_code,
      notes: round.notes,
      commissioner_name:
        round.commissioner.full_name ||
        round.commissioner.email?.split("@")[0] ||
        "Commissioner",
      players: round.players,
      skins_buy_in: round.skins_game
        ? Number(round.skins_game.buy_in)
        : null,
      nassau_bet_amount: round.nassau_bet
        ? Number(round.nassau_bet.bet_amount)
        : null,
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to load round" },
      { status: 500 }
    );
  }
}
