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

  const rounds = await prisma.rounds.findMany({
    where: { trip_id: tripId },
    orderBy: { created_at: "desc" },
  });
  return NextResponse.json(rounds);
}

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return unauthorized();

  const body = await req.json();
  const membership = await getTripMembership(body.tripId, user.id);
  if (!membership) return forbidden();

  const round = await prisma.rounds.create({
    data: {
      trip_id: body.tripId,
      name: body.name,
      course_name: body.courseName || "",
      date: body.date || "",
      group_size: body.groupSize || 4,
      groups: body.groups || [],
    },
  });
  return NextResponse.json(round, { status: 201 });
}
