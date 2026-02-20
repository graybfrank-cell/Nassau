import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser, getTripMembership, unauthorized, forbidden } from "@/lib/auth";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  const user = await getUser();
  if (!user) return unauthorized();

  const { id: tripId, memberId } = await params;
  const membership = await getTripMembership(tripId, user.id);
  if (!membership) return forbidden();

  const member = await prisma.tripMembers.findUnique({ where: { id: memberId } });
  if (!member || member.tripId !== tripId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.tripMembers.delete({ where: { id: memberId } });
  return NextResponse.json({ ok: true });
}
