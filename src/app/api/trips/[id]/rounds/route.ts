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

  const rounds = await prisma.rounds.findMany({
    where: { trip_id: tripId },
    orderBy: { created_at: "desc" },
  });
  return NextResponse.json(rounds);
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
  const round = await prisma.rounds.create({
    data: {
      trip_id: tripId,
      name: body.name,
      course_name: body.courseName || "",
      date: body.date || "",
      group_size: body.groupSize || 4,
      groups: body.groups || [],
      itinerary_item_id: body.itineraryItemId || null,
    },
  });
  return NextResponse.json(round, { status: 201 });
}
