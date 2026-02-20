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
  const lastItem = await prisma.itineraryItems.findFirst({
    where: { trip_id: tripId },
    orderBy: { sort_order: "desc" },
  });
  const sortOrder = (lastItem?.sort_order ?? -1) + 1;

  const item = await prisma.itineraryItems.create({
    data: {
      trip_id: tripId,
      date: body.date || "",
      time: body.time || "",
      type: body.type || "other",
      title: body.title || "",
      description: body.description || "",
      sort_order: sortOrder,
    },
  });
  return NextResponse.json(item, { status: 201 });
}
