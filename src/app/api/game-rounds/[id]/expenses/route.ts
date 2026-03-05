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

  const expenses = await prisma.gameExpenses.findMany({
    where: { round_id: roundId },
    orderBy: { created_at: "desc" },
  });

  return NextResponse.json(expenses);
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
  if (!round.players.some((p: any) => p.user_id === user.id)) return forbidden();

  const body = await req.json();

  const expense = await prisma.gameExpenses.create({
    data: {
      round_id: roundId,
      description: body.description,
      amount: body.amount,
      paid_by: body.paid_by,
      split_among: body.split_among || [],
      category: body.category || "other",
    },
  });

  return NextResponse.json(expense, { status: 201 });
}
