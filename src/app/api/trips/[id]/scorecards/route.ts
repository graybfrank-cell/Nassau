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

  const scorecards = await prisma.scorecards.findMany({
    where: { trip_id: tripId },
    orderBy: { created_at: "desc" },
  });
  return NextResponse.json(scorecards);
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
  const scorecard = await prisma.scorecards.create({
    data: {
      user_id: user.id,
      trip_id: tripId,
      course_name: body.courseName || "",
      course_api_id: body.courseApiId || null,
      tee_name: body.teeName || "",
      date: body.date || "",
      pars: body.pars || [],
      yardages: body.yardages || [],
      handicaps: body.handicaps || [],
      players: body.players || [],
    },
  });
  return NextResponse.json(scorecard, { status: 201 });
}
