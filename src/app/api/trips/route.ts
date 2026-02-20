import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser, unauthorized } from "@/lib/auth";

export async function GET(_req: NextRequest) {
  const user = await getUser();
  if (!user) return unauthorized();

  const trips = await prisma.trips.findMany({
    where: {
      OR: [
        { created_by: user.id },
        { members: { some: { user_id: user.id } } },
      ],
    },
    include: { members: { include: { user: true } } },
    orderBy: { created_at: "desc" },
  });
  return NextResponse.json(trips);
}

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return unauthorized();

  const body = await req.json();
  const trip = await prisma.trips.create({
    data: {
      created_by: user.id,
      name: body.name,
      destination: body.destination || "",
      start_date: body.startDate || "",
      end_date: body.endDate || "",
      members: {
        create: {
          user_id: user.id,
          name: user.email?.split("@")[0] || "Captain",
          role: "CAPTAIN",
          rsvp_status: "GOING",
        },
      },
    },
    include: { members: { include: { user: true } } },
  });
  return NextResponse.json(trip, { status: 201 });
}
