import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser, getTripMembership, unauthorized, forbidden } from "@/lib/auth";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const user = await getUser();
  if (!user) return unauthorized();

  const { id: tripId, itemId } = await params;
  const membership = await getTripMembership(tripId, user.id);
  if (!membership) return forbidden();

  const item = await prisma.itineraryItem.findUnique({ where: { id: itemId } });
  if (!item || item.tripId !== tripId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.itineraryItem.delete({ where: { id: itemId } });
  return NextResponse.json({ ok: true });
}
