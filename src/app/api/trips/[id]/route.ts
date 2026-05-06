import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser, getTripMembership, unauthorized, forbidden } from "@/lib/auth";
import { ensureDbColumns } from "@/lib/auto-migrate";
import { getTripState } from "@/lib/trip-state";
import { sendEmail, FROM_SYSTEM, REPLY_TO_SYSTEM } from "@/lib/email";
import {
  renderDateChangeNotification,
  formatDates,
} from "@/emails/DateChangeNotification";
import { generateTripICS } from "@/lib/calendar-ics";

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
          creator: {
            select: {
              id: true,
              subscription_tier: true,
              subscription_status: true,
            },
          },
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
        trip.members.some((m: any) => m.user_id === user.id);
      if (!isMember) return forbidden();

      if (
        getTripState(trip) === "active" &&
        !trip.first_active_at
      ) {
        prisma.trips
          .update({
            where: { id: trip.id },
            data: { first_active_at: new Date() },
          })
          .catch(() => {
            /* best effort — ignore */
          });
      }

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

    // Snapshot prior trip state — needed to detect date changes
    const previousTrip = await prisma.trips.findUnique({ where: { id } });

    const trip = await prisma.trips.update({
      where: { id },
      data,
      include: { members: { include: { user: true } } },
    });

    // Detect date change and notify confirmed crew (fire-and-forget)
    if (previousTrip) {
      const startChanged =
        data.start_date !== undefined &&
        data.start_date !== previousTrip.start_date;
      const endChanged =
        data.end_date !== undefined &&
        data.end_date !== previousTrip.end_date;

      if ((startChanged || endChanged) && trip.start_date && trip.end_date) {
        const hadPreviousDates =
          !!previousTrip.start_date && !!previousTrip.end_date;

        notifyDateChange({
          trip,
          newStartDate: trip.start_date,
          newEndDate: trip.end_date,
          previousStartDate: hadPreviousDates
            ? previousTrip.start_date
            : undefined,
          previousEndDate: hadPreviousDates
            ? previousTrip.end_date
            : undefined,
        }).catch((err) => {
          console.error("[trip PATCH] Date change notification failed:", err);
        });
      }
    }

    return NextResponse.json(trip);
  } catch (err) {
    console.error("PATCH /api/trips/[id] error:", err);
    const message =
      err instanceof Error ? err.message : "Failed to update trip";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * Send a date-change notification (with .ics calendar attachment) to every
 * confirmed or maybe crew member. Fire-and-forget per-member — one email
 * failure doesn't block the others.
 */
async function notifyDateChange(opts: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  trip: any;
  newStartDate: string;
  newEndDate: string;
  previousStartDate?: string;
  previousEndDate?: string;
}) {
  const { trip } = opts;
  const captainName =
    trip.members?.find((m: any) => m.role === "CAPTAIN")?.name || "Captain";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recipients: { email: string }[] = (trip.members || [])
    .filter(
      (m: any) =>
        (m.rsvp_status === "GOING" || m.rsvp_status === "MAYBE") &&
        m.role !== "CAPTAIN"
    )
    .map((m: any) => ({
      email: m.email || m.user?.email || "",
    }))
    .filter((r: { email: string }) => !!r.email);

  if (recipients.length === 0) return;

  const shareCode = trip.share_code;
  const tripUrl = shareCode
    ? `https://nassau.golf/trip/${shareCode}`
    : `https://nassau.golf/trips/${trip.id}`;

  const icsContent = generateTripICS({
    tripName: trip.name,
    startDate: opts.newStartDate,
    endDate: opts.newEndDate,
    destination: trip.destination || "",
    tripUrl,
  });
  const icsBase64 = Buffer.from(icsContent).toString("base64");
  const icsFilename = `${trip.name.replace(/[^a-zA-Z0-9-_ ]/g, "").trim() || "trip"}.ics`;

  const isChange = !!(opts.previousStartDate && opts.previousEndDate);
  const subject = isChange
    ? `Dates moved for ${trip.name}`
    : `Dates locked: ${formatDates(opts.newStartDate, opts.newEndDate)} for ${trip.name}`;

  const html = renderDateChangeNotification({
    captainName,
    tripName: trip.name,
    newStartDate: opts.newStartDate,
    newEndDate: opts.newEndDate,
    previousStartDate: opts.previousStartDate,
    previousEndDate: opts.previousEndDate,
    tripUrl,
  });

  await Promise.all(
    recipients.map((r) =>
      sendEmail({
        from: FROM_SYSTEM,
        replyTo: REPLY_TO_SYSTEM,
        to: r.email,
        subject,
        html,
        attachments: [{ filename: icsFilename, content: icsBase64 }],
      }).catch((err) => {
        console.error("[trip PATCH] Per-member email failed:", r.email, err);
        return false;
      })
    )
  );
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
