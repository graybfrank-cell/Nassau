import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureDbColumns } from "@/lib/auto-migrate";

// GET /api/trip/[shareCode] - Public trip lookup by share code
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ shareCode: string }> }
) {
  const { shareCode } = await params;

  try {
    let trip;
    try {
      trip = await prisma.trips.findUnique({
        where: { share_code: shareCode },
        include: {
          members: {
            select: {
              id: true,
              name: true,
              email: true,
              user_id: true,
              role: true,
              rsvp_status: true,
              handicap: true,
            },
          },
        },
      });
    } catch {
      // Likely missing columns — auto-migrate and retry
      await ensureDbColumns();
      trip = await prisma.trips.findUnique({
        where: { share_code: shareCode },
        include: {
          members: {
            select: {
              id: true,
              name: true,
              email: true,
              user_id: true,
              role: true,
              rsvp_status: true,
              handicap: true,
            },
          },
        },
      });
    }

    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }

    // Return safe public data
    return NextResponse.json({
      id: trip.id,
      name: trip.name,
      destination: trip.destination,
      startDate: trip.start_date,
      endDate: trip.end_date,
      vibe: trip.vibe,
      shareCode: trip.share_code,
      members: trip.members.map((m) => ({
        id: m.id,
        name: m.name,
        role: m.role,
        rsvpStatus: m.rsvp_status,
        handicap: Number(m.handicap),
        userId: m.user_id,
      })),
    });
  } catch (err) {
    console.error("GET /api/trip/[shareCode] error:", err);
    const message = err instanceof Error ? err.message : "Failed to load trip";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
