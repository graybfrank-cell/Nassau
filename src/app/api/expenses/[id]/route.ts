import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser, getTripMembership, unauthorized, forbidden } from "@/lib/auth";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user) return unauthorized();

  const { id } = await params;
  const expense = await prisma.expenses.findUnique({ where: { id } });
  if (!expense) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const membership = await getTripMembership(expense.trip_id, user.id);
  if (!membership) return forbidden();

  await prisma.expenses.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
