import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;

  const trip = await prisma.trip.findUnique({
    where: { inviteCode: code },
    select: {
      id: true,
      name: true,
      destination: true,
      startDate: true,
      endDate: true,
      members: true,
    },
  });

  if (!trip) {
    return NextResponse.json({ error: "Invalid invite link" }, { status: 404 });
  }

  return NextResponse.json(trip);
}
