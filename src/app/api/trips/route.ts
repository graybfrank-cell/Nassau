import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }
  const trips = await prisma.trip.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(trips);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const trip = await prisma.trip.create({
    data: {
      userId: body.userId,
      name: body.name,
      destination: body.destination || "",
      startDate: body.startDate || "",
      endDate: body.endDate || "",
      members: body.members || [],
    },
  });
  return NextResponse.json(trip, { status: 201 });
}
