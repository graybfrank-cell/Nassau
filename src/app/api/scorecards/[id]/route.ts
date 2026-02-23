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

  if (scorecard.user_id !== user.id) return forbidden();

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
  if (scorecard.user_id !== user.id) return forbidden();

  const body = await req.json();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = {};
  if (body.courseName !== undefined) data.course_name = body.courseName;
  if (body.courseApiId !== undefined) data.course_api_id = body.courseApiId;
  if (body.teeName !== undefined) data.tee_name = body.teeName;
  if (body.date !== undefined) data.date = body.date;
  if (body.pars !== undefined) data.pars = body.pars;
  if (body.yardages !== undefined) data.yardages = body.yardages;
  if (body.handicaps !== undefined) data.handicaps = body.handicaps;
  if (body.players !== undefined) data.players = body.players;

  const updated = await prisma.scorecards.update({
    where: { id },
    data,
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
  if (scorecard.user_id !== user.id) return forbidden();

  await prisma.scorecards.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
