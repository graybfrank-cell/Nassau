import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser, getTripMembership, unauthorized, forbidden } from "@/lib/auth";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user) return unauthorized();

  const { id: tripId } = await params;
  const membership = await getTripMembership(tripId, user.id);
  if (!membership) return forbidden();

  const body = await req.json();
  const itemIds: string[] = body.itemIds;

  if (!Array.isArray(itemIds) || itemIds.length === 0) {
    return NextResponse.json({ error: "itemIds required" }, { status: 400 });
  }

  // Update sort_order for each item based on its position in the array
  await Promise.all(
    itemIds.map((id, index) =>
      prisma.itineraryItems.updateMany({
        where: { id, trip_id: tripId },
        data: { sort_order: index },
      })
    )
  );

  return NextResponse.json({ ok: true });
}
