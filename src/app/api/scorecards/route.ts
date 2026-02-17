import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  const tripId = req.nextUrl.searchParams.get("tripId");

  if (!userId && !tripId) {
    return NextResponse.json(
      { error: "userId or tripId required" },
      { status: 400 }
    );
  }

  const where: Record<string, string> = {};
  if (userId) where.userId = userId;
  if (tripId) where.tripId = tripId;

  const scorecards = await prisma.scorecard.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(scorecards);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const scorecard = await prisma.scorecard.create({
    data: {
      userId: body.userId,
      tripId: body.tripId || null,
      courseName: body.courseName || "",
      date: body.date || "",
      pars: body.pars || [],
      players: body.players || [],
    },
  });
  return NextResponse.json(scorecard, { status: 201 });
}
