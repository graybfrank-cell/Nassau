import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser, unauthorized, forbidden } from "@/lib/auth";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; expenseId: string }> }
) {
  const user = await getUser();
  if (!user) return unauthorized();

  const { id: roundId, expenseId } = await params;

  const round = await prisma.gameRounds.findUnique({
    where: { id: roundId },
    include: { players: true },
  });
  if (!round) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const isCommissioner = round.commissioner_id === user.id;
  if (!isCommissioner) return forbidden();

  await prisma.gameExpenses.delete({ where: { id: expenseId } });
  return NextResponse.json({ ok: true });
}
