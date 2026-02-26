import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser, getTripMembership, unauthorized, forbidden } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user) return unauthorized();

  const { id: tripId } = await params;
  const membership = await getTripMembership(tripId, user.id);
  if (!membership || (membership.role !== "CAPTAIN" && membership.role !== "CO_CAPTAIN")) {
    return forbidden();
  }

  const body = await req.json();
  const items: { id: string; sort_order: number }[] = body.items;

  if (!Array.isArray(items)) {
    return NextResponse.json({ error: "items must be an array" }, { status: 400 });
  }

  // Bulk-update sort_order for each item
  await prisma.$transaction(
    items.map((item) =>
      prisma.itineraryItems.update({
        where: { id: item.id },
        data: { sort_order: item.sort_order },
      })
    )
  );

  return NextResponse.json({ ok: true });
}
