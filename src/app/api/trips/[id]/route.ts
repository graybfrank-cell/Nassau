import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser, getTripMembership, unauthorized, forbidden } from "@/lib/auth";
import { ensureDbColumns } from "@/lib/auto-migrate";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user) return unauthorized();

  const { id } = await params;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const trip = await prisma.trips.findUnique({
        where: { id },
        include: {
          members: { include: { user: true } },
          itineraryItems: { orderBy: { sort_order: "asc" } },
          expenses: {
            include: { payer: true, splits: { include: { member: true } } },
          },
          rounds: { orderBy: { created_at: "desc" } },
          skinsGames: { orderBy: { created_at: "desc" } },
          scorecards: { orderBy: { created_at: "desc" } },
        },
      });
      if (!trip) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }

      const isMember =
        trip.created_by === user.id ||
        trip.members.some((m) => m.user_id === user.id);
      if (!isMember) return forbidden();

      return NextResponse.json(trip);
    } catch (err) {
      if (attempt === 0) {
        // First failure — likely missing DB columns. Auto-migrate and retry.
        console.error("GET /api/trips/[id] failed, attempting auto-migration:", err);
        try {
          await ensureDbColumns();
        } catch {
          // Migration failed (e.g. unreachable DB) — fall through to error
        }
        continue;
      }
      console.error("GET /api/trips/[id] error:", err);
      const message =
        err instanceof Error ? err.message : "Failed to load trip";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  // Should not reach here, but satisfy TypeScript
  return NextResponse.json({ error: "Failed to load trip" }, { status: 500 });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user) return unauthorized();

  const { id } = await params;
  const membership = await getTripMembership(id, user.id);
  if (!membership) return forbidden();

  try {
    const body = await req.json();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = {};
    if (body.name !== undefined) data.name = body.name;
    if (body.destination !== undefined) data.destination = body.destination;
    if (body.startDate !== undefined) data.start_date = body.startDate;
    if (body.endDate !== undefined) data.end_date = body.endDate;
    if (body.arrivalTime !== undefined) data.arrival_time = body.arrivalTime;
    if (body.departureTime !== undefined)
      data.departure_time = body.departureTime;
    if (body.lodging !== undefined) data.lodging = body.lodging;

    const trip = await prisma.trips.update({
      where: { id },
      data,
      include: { members: { include: { user: true } } },
    });
    return NextResponse.json(trip);
  } catch (err) {
    console.error("PATCH /api/trips/[id] error:", err);
    const message =
      err instanceof Error ? err.message : "Failed to update trip";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user) return unauthorized();

  const { id } = await params;

  try {
    const trip = await prisma.trips.findUnique({ where: { id } });
    if (!trip) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (trip.created_by !== user.id) return forbidden();

    await prisma.trips.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/trips/[id] error:", err);
    const message =
      err instanceof Error ? err.message : "Failed to delete trip";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
