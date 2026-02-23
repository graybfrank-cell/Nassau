import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser, getTripMembership, unauthorized, forbidden } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user) return unauthorized();

  const { id: tripId } = await params;
  const membership = await getTripMembership(tripId, user.id);
  if (!membership) return forbidden();

  const expenses = await prisma.expenses.findMany({
    where: { trip_id: tripId },
    include: { payer: true, splits: { include: { member: true } } },
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

  const { id: tripId } = await params;
  const membership = await getTripMembership(tripId, user.id);
  if (!membership) return forbidden();

  const body = await req.json();
  const expense = await prisma.expenses.create({
    data: {
      trip_id: tripId,
      description: body.description,
      amount: body.amount,
      category: body.category || "",
      paid_by: body.paidBy || null,
      split_method: body.splitMethod || "EQUAL",
      splits: body.splits
        ? {
            create: body.splits.map((s: { memberId: string; amount: number }) => ({
              member_id: s.memberId,
              amount: s.amount,
            })),
          }
        : undefined,
    },
    include: { payer: true, splits: { include: { member: true } } },
  });
  return NextResponse.json(expense, { status: 201 });
}
