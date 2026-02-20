import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser, getTripMembership, unauthorized, forbidden } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user) return unauthorized();

  const { id } = await params;
  const game = await prisma.skinsGames.findUnique({ where: { id } });
  if (!game) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const membership = await getTripMembership(game.tripId, user.id);
  if (!membership) return forbidden();

  const body = await req.json();
  const updated = await prisma.skinsGames.update({
    where: { id },
    data: {
      name: body.name,
      buyIn: body.buyIn,
      dayNumber: body.dayNumber,
      players: body.players,
      holes: body.holes,
    },
  });
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user) return unauthorized();

  const { id } = await params;
  const game = await prisma.skinsGames.findUnique({ where: { id } });
  if (!game) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const membership = await getTripMembership(game.tripId, user.id);
  if (!membership) return forbidden();

  await prisma.skinsGames.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
