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
  const round = await prisma.rounds.findUnique({ where: { id } });
  if (!round) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const membership = await getTripMembership(round.trip_id, user.id);
  if (!membership) return forbidden();

  const body = await req.json();
  const updated = await prisma.rounds.update({
    where: { id },
    data: {
      name: body.name,
      course_name: body.courseName,
      date: body.date,
      group_size: body.groupSize,
      groups: body.groups,
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
  const round = await prisma.rounds.findUnique({ where: { id } });
  if (!round) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const membership = await getTripMembership(round.trip_id, user.id);
  if (!membership) return forbidden();

  await prisma.rounds.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
