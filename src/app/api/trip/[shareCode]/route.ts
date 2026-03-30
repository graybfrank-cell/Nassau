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

    // Fetch active or recent poll for this trip
    let pollData = null;
    try {
      const poll = await prisma.datePolls.findFirst({
        where: { trip_id: trip.id },
        orderBy: { created_at: "desc" },
        include: {
          options: { orderBy: { sort_order: "asc" } },
          votes: true,
        },
      });
      if (poll) {
        pollData = {
          id: poll.id,
          status: poll.status,
          deadline: poll.deadline,
          lockedOptionId: poll.locked_option_id,
          options: poll.options.map((opt: any) => ({
            id: opt.id,
            startDate: opt.start_date,
            endDate: opt.end_date,
            label: opt.label,
            votes: poll.votes
              .filter((v: any) => v.option_id === opt.id)
              .map((v: any) => ({ userId: v.user_id, vote: v.vote })),
          })),
        };
      }
    } catch {
      // Poll fetch non-critical for share page
    }

    // Fetch schedule / itinerary for this trip
    let scheduleData: { date: string; title: string; type: string }[] = [];
    try {
      const items = await prisma.scheduleItems.findMany({
        where: { trip_id: trip.id },
        orderBy: [{ date: "asc" }, { sort_order: "asc" }],
        select: { date: true, title: true, type: true },
      });
      scheduleData = items.map((s: any) => ({
        date: s.date,
        title: s.title,
        type: s.type,
      }));
    } catch {
      // Schedule fetch non-critical
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
      groupSizeTarget: trip.group_size_target,
      members: trip.members.map((m: any) => ({
        id: m.id,
        name: m.name,
        role: m.role,
        rsvpStatus: m.rsvp_status,
        handicap: Number(m.handicap),
        userId: m.user_id,
      })),
      schedule: scheduleData,
      datePoll: pollData,
    });
  } catch (err) {
    console.error("GET /api/trip/[shareCode] error:", err);
    const message = err instanceof Error ? err.message : "Failed to load trip";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
