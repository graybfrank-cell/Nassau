import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser, getTripMembership, unauthorized, forbidden } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const user = await getUser();
  if (!user) return unauthorized();

  const { id: tripId, itemId } = await params;
  const membership = await getTripMembership(tripId, user.id);
  if (!membership) return forbidden();

  const item = await prisma.itineraryItems.findUnique({ where: { id: itemId } });
  if (!item || item.trip_id !== tripId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = {};
  if (body.booking_status !== undefined) data.booking_status = body.booking_status;
  if (body.title !== undefined) data.title = body.title;
  if (body.description !== undefined) data.description = body.description;
  if (body.time !== undefined) data.time = body.time;
  if (body.type !== undefined) data.type = body.type;
  if (body.cost !== undefined) data.cost = body.cost;
  if (body.phone !== undefined) data.phone = body.phone;
  if (body.website !== undefined) data.website = body.website;
  if (body.email !== undefined) data.email = body.email;

  const updated = await prisma.itineraryItems.update({
    where: { id: itemId },
    data,
  });
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const user = await getUser();
  if (!user) return unauthorized();

  const { id: tripId, itemId } = await params;
  const membership = await getTripMembership(tripId, user.id);
  if (!membership) return forbidden();

  const item = await prisma.itineraryItems.findUnique({ where: { id: itemId } });
  if (!item || item.trip_id !== tripId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.itineraryItems.delete({ where: { id: itemId } });
  return NextResponse.json({ ok: true });
}
