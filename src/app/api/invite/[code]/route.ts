import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;

  const trip = await prisma.trips.findUnique({
    where: { invite_code: code },
    select: {
      id: true,
      name: true,
      destination: true,
      start_date: true,
      end_date: true,
      members: {
        select: { id: true, name: true, handicap: true, user_id: true },
      },
    },
  });

  if (!trip) {
    return NextResponse.json({ error: "Invalid invite link" }, { status: 404 });
  }

  return NextResponse.json(trip);
}
