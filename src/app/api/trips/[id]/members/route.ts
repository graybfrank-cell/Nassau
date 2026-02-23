import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser, getTripMembership, unauthorized, forbidden } from "@/lib/auth";

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
  const member = await prisma.tripMembers.create({
    data: {
      trip_id: tripId,
      name: body.name || "",
      handicap: body.handicap ?? 0,
      role: "MEMBER",
      rsvp_status: "PENDING",
    },
  });
  return NextResponse.json(member, { status: 201 });
}
