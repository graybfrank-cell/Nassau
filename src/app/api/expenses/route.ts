import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser, getTripMembership, unauthorized, forbidden } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getUser();
  if (!user) return unauthorized();

  const tripId = req.nextUrl.searchParams.get("tripId");
  if (!tripId) {
    return NextResponse.json({ error: "tripId required" }, { status: 400 });
  }

  const membership = await getTripMembership(tripId, user.id);
  if (!membership) return forbidden();

  const expenses = await prisma.expenses.findMany({
    where: { tripId },
    include: { payer: true, splits: { include: { member: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(expenses);
}

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return unauthorized();

  const body = await req.json();
  const membership = await getTripMembership(body.tripId, user.id);
  if (!membership) return forbidden();

  const expense = await prisma.expenses.create({
    data: {
      tripId: body.tripId,
      description: body.description,
      amount: body.amount,
      category: body.category || "",
      paidBy: body.paidBy || null,
      splitMethod: body.splitMethod || "EQUAL",
      splits: body.splits
        ? {
            create: body.splits.map((s: { memberId: string; amount: number }) => ({
              memberId: s.memberId,
              amount: s.amount,
            })),
          }
        : undefined,
    },
    include: { payer: true, splits: { include: { member: true } } },
  });
  return NextResponse.json(expense, { status: 201 });
}
