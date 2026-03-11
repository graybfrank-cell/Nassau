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
    include: { players: true },
  });
  if (!round) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!round.players.some((p: any) => p.user_id === user.id)) return forbidden();

  const nassauBet = await prisma.gameNassauBets.findUnique({
    where: { round_id: roundId },
  });

  if (!nassauBet) {
    return NextResponse.json({ error: "No Nassau bet for this round" }, { status: 404 });
  }

  return NextResponse.json(nassauBet);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user) return unauthorized();

  const { id: roundId } = await params;

  const round = await prisma.gameRounds.findUnique({
    where: { id: roundId },
    include: { players: true },
  });
  if (!round) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (round.commissioner_id !== user.id) return forbidden();

  const body = await req.json();
  const betAmount = body.betAmount || 10;

  const nassauBet = await prisma.gameNassauBets.upsert({
    where: { round_id: roundId },
    create: {
      round_id: roundId,
      bet_amount: betAmount,
    },
    update: {
      bet_amount: betAmount,
    },
  });

  return NextResponse.json(nassauBet, { status: 201 });
}

export async function DELETE(
  _req: NextRequest,
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

  await prisma.gameNassauBets.deleteMany({ where: { round_id: roundId } });
  return NextResponse.json({ ok: true });
}
