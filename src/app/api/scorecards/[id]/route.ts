import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser, unauthorized, forbidden } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user) return unauthorized();

  const { id } = await params;
  const scorecard = await prisma.scorecards.findUnique({ where: { id } });
  if (!scorecard) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Must be the owner of the scorecard
  if (scorecard.userId !== user.id) return forbidden();

  return NextResponse.json(scorecard);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user) return unauthorized();

  const { id } = await params;
  const scorecard = await prisma.scorecards.findUnique({ where: { id } });
  if (!scorecard) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (scorecard.userId !== user.id) return forbidden();

  const body = await req.json();
  const updated = await prisma.scorecards.update({
    where: { id },
    data: {
      courseName: body.courseName,
      date: body.date,
      pars: body.pars,
      players: body.players,
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
  const scorecard = await prisma.scorecards.findUnique({ where: { id } });
  if (!scorecard) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (scorecard.userId !== user.id) return forbidden();

  await prisma.scorecards.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
