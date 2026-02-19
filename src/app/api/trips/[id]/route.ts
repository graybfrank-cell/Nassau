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

  const trip = await prisma.trip.findUnique({
    where: { id },
    include: {
      members: { include: { user: true } },
      itineraryItems: { orderBy: { sortOrder: "asc" } },
      expenses: { include: { payer: true, splits: { include: { member: true } } } },
      rounds: { orderBy: { createdAt: "desc" } },
      skinsGames: { orderBy: { createdAt: "desc" } },
      scorecards: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!trip) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const isMember = trip.createdBy === user.id || trip.members.some((m) => m.userId === user.id);
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
  const trip = await prisma.trip.update({
    where: { id },
    data: {
      name: body.name,
      destination: body.destination,
      startDate: body.startDate,
      endDate: body.endDate,
      arrivalTime: body.arrivalTime,
      departureTime: body.departureTime,
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
  const trip = await prisma.trip.findUnique({ where: { id } });
  if (!trip) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (trip.createdBy !== user.id) return forbidden();

  await prisma.trip.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
