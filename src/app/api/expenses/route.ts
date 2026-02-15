import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const tripId = req.nextUrl.searchParams.get("tripId");
  if (!tripId) {
    return NextResponse.json({ error: "tripId required" }, { status: 400 });
  }
  const expenses = await prisma.expense.findMany({
    where: { tripId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(expenses);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const expense = await prisma.expense.create({
    data: {
      tripId: body.tripId,
      description: body.description,
      amount: body.amount,
      paidBy: body.paidBy,
      splitAmong: body.splitAmong || [],
    },
  });
  return NextResponse.json(expense, { status: 201 });
}
