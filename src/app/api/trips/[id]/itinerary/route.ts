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

  // Determine sort order: place after the last existing item
  const lastItem = await prisma.itineraryItem.findFirst({
    where: { tripId },
    orderBy: { sortOrder: "desc" },
  });
  const sortOrder = (lastItem?.sortOrder ?? -1) + 1;

  const item = await prisma.itineraryItem.create({
    data: {
      tripId,
      date: body.date || "",
      time: body.time || "",
      type: body.type || "other",
      title: body.title || "",
      description: body.description || "",
      sortOrder,
    },
  });
  return NextResponse.json(item, { status: 201 });
}
