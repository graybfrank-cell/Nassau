import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const tripId = req.nextUrl.searchParams.get("tripId");
  if (!tripId) {
    return NextResponse.json({ error: "tripId required" }, { status: 400 });
  }
  const rounds = await prisma.round.findMany({
    where: { tripId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(rounds);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const round = await prisma.round.create({
    data: {
      tripId: body.tripId,
      name: body.name,
      courseName: body.courseName || "",
      date: body.date || "",
      groups: body.groups || [],
    },
  });
  return NextResponse.json(round, { status: 201 });
}
