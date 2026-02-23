import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser, unauthorized } from "@/lib/auth";
import crypto from "crypto";

function generateShareCode(): string {
  // 8 uppercase alphanumeric chars, no ambiguous characters (0/O, 1/l/I)
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.randomBytes(8);
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars[bytes[i] % chars.length];
  }
  return code;
}

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

  try {
    const body = await req.json();

    // Build itinerary placeholder items from date range
    const itineraryItems: {
      day_number: number;
      date: string;
      title: string;
      type: string;
      sort_order: number;
    }[] = [];
    if (body.startDate && body.endDate) {
      const start = new Date(body.startDate + "T12:00:00");
      const end = new Date(body.endDate + "T12:00:00");
      const days =
        Math.round(
          (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
        ) + 1;
      for (let d = 0; d < days && d < 14; d++) {
        const date = new Date(start);
        date.setDate(date.getDate() + d);
        const dateStr = date.toISOString().split("T")[0];
        itineraryItems.push({
          day_number: d + 1,
          date: dateStr,
          title: `Day ${d + 1}`,
          type: "other",
          sort_order: d,
        });
      }
    }

    // First try: create with all new fields (share_code, vibe, etc.)
    // If the DB columns don't exist yet (prisma db push hasn't run),
    // fall back to creating with only the original fields.
    let trip;
    try {
      const shareCode = generateShareCode();
      trip = await prisma.trips.create({
        data: {
          created_by: user.id,
          name: body.name,
          destination: body.destination || "",
          start_date: body.startDate || "",
          end_date: body.endDate || "",
          share_code: shareCode,
          vibe: body.vibe || null,
          budget_tier: body.budgetTier || null,
          group_size_target: body.groupSizeTarget || null,
          notes: body.notes || null,
          members: {
            create: {
              user_id: user.id,
              name: user.email?.split("@")[0] || "Captain",
              role: "CAPTAIN",
              rsvp_status: "GOING",
            },
          },
          ...(itineraryItems.length > 0
            ? { itineraryItems: { create: itineraryItems } }
            : {}),
        },
        include: {
          members: { include: { user: true } },
          itineraryItems: { orderBy: { sort_order: "asc" } },
        },
      });
    } catch (fullErr) {
      // Fallback: create with only the original columns
      console.error(
        "Trip creation with new fields failed, falling back to basic fields:",
        fullErr
      );
      trip = await prisma.trips.create({
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
          ...(itineraryItems.length > 0
            ? { itineraryItems: { create: itineraryItems } }
            : {}),
        },
        include: {
          members: { include: { user: true } },
          itineraryItems: { orderBy: { sort_order: "asc" } },
        },
      });
    }

    return NextResponse.json(trip, { status: 201 });
  } catch (err) {
    console.error("POST /api/trips error:", err);
    const message =
      err instanceof Error ? err.message : "Failed to create trip";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
