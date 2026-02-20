import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser, unauthorized } from "@/lib/auth";

export async function GET(_req: NextRequest) {
  const user = await getUser();
  if (!user) return unauthorized();

  const trips = await prisma.trips.findMany({
    where: {
      OR: [
        { createdBy: user.id },
        { members: { some: { userId: user.id } } },
      ],
    },
    include: { members: { include: { user: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(trips);
}

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return unauthorized();

  const body = await req.json();
  const trip = await prisma.trips.create({
    data: {
      createdBy: user.id,
      name: body.name,
      destination: body.destination || "",
      startDate: body.startDate || "",
      endDate: body.endDate || "",
      members: {
        create: {
          userId: user.id,
          name: user.email?.split("@")[0] || "Captain",
          role: "CAPTAIN",
          rsvpStatus: "GOING",
        },
      },
    },
    include: { members: { include: { user: true } } },
  });
  return NextResponse.json(trip, { status: 201 });
}
