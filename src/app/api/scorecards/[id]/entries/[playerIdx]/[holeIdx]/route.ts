import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser, unauthorized, forbidden } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  {
    params,
  }: {
    params: Promise<{ id: string; playerIdx: string; holeIdx: string }>;
  }
) {
  const user = await getUser();
  if (!user) return unauthorized();

  const { id, playerIdx: piStr, holeIdx: hiStr } = await params;
  const playerIdx = parseInt(piStr, 10);
  const holeIdx = parseInt(hiStr, 10);

  if (isNaN(playerIdx) || isNaN(holeIdx)) {
    return NextResponse.json({ error: "Invalid indices" }, { status: 400 });
  }

  const scorecard = await prisma.scorecards.findUnique({ where: { id } });
  if (!scorecard) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (scorecard.user_id !== user.id) return forbidden();

  const body = await req.json();
  const score: number | null =
    body.score === null || body.score === undefined
      ? null
      : Math.min(Math.max(Math.round(Number(body.score)), 1), 15);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const players = scorecard.players as any[];
  if (playerIdx < 0 || playerIdx >= players.length) {
    return NextResponse.json(
      { error: "Player index out of range" },
      { status: 400 }
    );
  }
  if (holeIdx < 0 || holeIdx >= 18) {
    return NextResponse.json(
      { error: "Hole index out of range" },
      { status: 400 }
    );
  }

  const updatedPlayers = players.map(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (p: any, pi: number) => {
      if (pi !== playerIdx) return p;
      const newScores = [...p.scores];
      newScores[holeIdx] = score;
      return { ...p, scores: newScores };
    }
  );

  const updated = await prisma.scorecards.update({
    where: { id },
    data: { players: updatedPlayers },
  });

  return NextResponse.json({
    ok: true,
    playerIdx,
    holeIdx,
    score,
    players: updated.players,
  });
}
