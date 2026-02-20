import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser, getTripMembership, unauthorized, forbidden } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user) return unauthorized();

  const { id } = await params;

  const trip = await prisma.trips.findUnique({
    where: { id },
    include: {
      members: { include: { user: true } },
      itineraryItems: { orderBy: { sort_order: "asc" } },
      expenses: { include: { payer: true, splits: { include: { member: true } } } },
      rounds: { orderBy: { created_at: "desc" } },
      skinsGames: { orderBy: { created_at: "desc" } },
      scorecards: { orderBy: { created_at: "desc" } },
    },
  });
  if (!trip) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const isMember = trip.created_by === user.id || trip.members.some((m) => m.user_id === user.id);
  if (!isMember) return forbidden();

  return NextResponse.json(trip);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user) return unauthorized();

  const { id } = await params;
  const membership = await getTripMembership(id, user.id);
  if (!membership) return forbidden();

  const body = await req.json();
  const trip = await prisma.trips.update({
    where: { id },
    data: {
      name: body.name,
      destination: body.destination,
      start_date: body.startDate,
      end_date: body.endDate,
      arrival_time: body.arrivalTime,
      departure_time: body.departureTime,
      lodging: body.lodging,
    },
    include: { members: { include: { user: true } } },
  });
  return NextResponse.json(trip);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user) return unauthorized();

  const { id } = await params;
  const trip = await prisma.trips.findUnique({ where: { id } });
  if (!trip) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (trip.created_by !== user.id) return forbidden();

  await prisma.trips.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
