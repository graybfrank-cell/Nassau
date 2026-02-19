import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser, getTripMembership, unauthorized, forbidden } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getUser();
  if (!user) return unauthorized();

  const tripId = req.nextUrl.searchParams.get("tripId");

  // If tripId provided, verify membership then return all trip scorecards
  if (tripId) {
    const membership = await getTripMembership(tripId, user.id);
    if (!membership) return forbidden();

    const scorecards = await prisma.scorecard.findMany({
      where: { tripId },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(scorecards);
  }

  // Otherwise return the current user's scorecards
  const scorecards = await prisma.scorecard.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(scorecards);
}

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return unauthorized();

  const body = await req.json();

  // If tied to a trip, verify membership
  if (body.tripId) {
    const membership = await getTripMembership(body.tripId, user.id);
    if (!membership) return forbidden();
  }

  const scorecard = await prisma.scorecard.create({
    data: {
      userId: user.id,
      tripId: body.tripId || null,
      courseName: body.courseName || "",
      date: body.date || "",
      pars: body.pars || [],
      players: body.players || [],
    },
  });
  return NextResponse.json(scorecard, { status: 201 });
}
