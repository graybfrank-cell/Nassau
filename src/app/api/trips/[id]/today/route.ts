import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import {
  getTripState,
  activeTripDayNumber,
  daysUntilTripStart,
  type TripState,
} from "@/lib/trip-state";
import { isTripUnlocked } from "@/lib/trip-payment";

// Response shape — this contract is what TodayView component will consume
export type TodayPayload = {
  trip: {
    id: string;
    name: string;
    destination: string;
    start_date: string;
    end_date: string;
    state: TripState;
    day_number: number; // 1-indexed if active, 0 otherwise
    days_until_start: number; // for planning state
    unlocked: boolean;
  };
  captain: {
    id: string;
    full_name: string;
    avatar_url: string;
  } | null;
  members: Array<{
    id: string;
    name: string;
    handicap: number;
    role: string;
    rsvp_status: string;
    avatar_url: string | null;
  }>;
  today_schedule: Array<{
    id: string;
    time: string;
    title: string;
    type: string;
    description: string;
    cost: number;
  }>;
  live_scoreboard: Array<{
    player_id: string;
    player_name: string;
    thru_holes: number;
    score_to_par: number; // negative = under par
    position: number;
  }>;
  recent_photos: Array<{
    id: string;
    url: string;
    uploaded_by: string;
    uploaded_at: string;
  }>;
  first_birdie_fired_at: string | null; // for Prompt 20 delight moment
};

type ScorecardPlayer = {
  id?: string;
  name?: string;
  scores?: Array<number | null>;
};

type MemberRow = {
  id: string;
  user_id: string | null;
  name: string;
  handicap: unknown;
  role: string;
  rsvp_status: string;
  user: { id: string; full_name: string; avatar_url: string } | null;
};

type ItineraryRow = {
  id: string;
  day_number: number | null;
  date: string;
  time: string;
  type: string;
  title: string;
  description: string;
  cost: unknown;
};

function todayIsoDate(now: Date = new Date()): string {
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(now.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * GET /api/trips/[id]/today
 *
 * Returns aggregated live trip data for Active Dashboard / Today View.
 *
 * Manual test:
 *   curl -H "Cookie: <auth-cookie>" https://nassau.golf/api/trips/<trip-id>/today
 *
 * Auth: requires trip captain or member.
 * Trip must be unlocked (paid or covered by Founding Member).
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const trip = await prisma.trips.findUnique({
    where: { id },
    include: {
      creator: {
        select: {
          id: true,
          full_name: true,
          avatar_url: true,
          subscription_tier: true,
          subscription_status: true,
        },
      },
      members: {
        include: {
          user: {
            select: { id: true, full_name: true, avatar_url: true },
          },
        },
      },
      itineraryItems: { orderBy: { sort_order: "asc" } },
    },
  });

  if (!trip) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const isCaptain = trip.created_by === user.id;
  const isMember =
    isCaptain ||
    trip.members.some((m: MemberRow) => m.user_id === user.id);
  if (!isMember) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!isTripUnlocked(trip, trip.creator)) {
    return NextResponse.json(
      { error: "Trip is locked. Captain must complete payment." },
      { status: 403 }
    );
  }

  const now = new Date();
  const state = getTripState(trip, now);
  const dayNumber = activeTripDayNumber(trip, now);
  const daysUntilStart = daysUntilTripStart(trip, now);
  const todayDate = todayIsoDate(now);

  // ─── today_schedule ─────────────────────────────────────────
  const itineraryItems: ItineraryRow[] = trip.itineraryItems;
  const toScheduleEntry = (item: ItineraryRow) => ({
    id: item.id,
    time: item.time,
    title: item.title,
    type: item.type,
    description: item.description,
    cost: Number(item.cost),
  });

  let todaySchedule: TodayPayload["today_schedule"] = [];
  if (state === "active") {
    todaySchedule = itineraryItems
      .filter((item: ItineraryRow) => {
        if (item.date && item.date.length > 0) return item.date === todayDate;
        // Fall back to day_number mapping when dates are unset
        return item.day_number === dayNumber;
      })
      .map(toScheduleEntry);
  } else if (state === "planning") {
    // Preview the first day for planning trips. Prefer day_number === 1,
    // else fall back to the earliest dated items.
    const dayOne = itineraryItems.filter(
      (item: ItineraryRow) => item.day_number === 1
    );
    if (dayOne.length > 0) {
      todaySchedule = dayOne.map(toScheduleEntry);
    } else {
      const earliestDate = itineraryItems
        .map((item: ItineraryRow) => item.date)
        .filter((d: string) => d && d.length > 0)
        .sort()[0];
      if (earliestDate) {
        todaySchedule = itineraryItems
          .filter((item: ItineraryRow) => item.date === earliestDate)
          .map(toScheduleEntry);
      }
    }
  }

  // ─── live_scoreboard ────────────────────────────────────────
  let liveScoreboard: TodayPayload["live_scoreboard"] = [];
  try {
    const scorecards = await prisma.scorecards.findMany({
      where: { trip_id: id, date: todayDate },
    });

    type Aggregate = {
      player_id: string;
      player_name: string;
      thru_holes: number;
      score_to_par: number;
    };
    const byPlayer = new Map<string, Aggregate>();

    for (const card of scorecards) {
      const pars = (card.pars as unknown as Array<number | null>) ?? [];
      const players =
        (card.players as unknown as ScorecardPlayer[]) ?? [];
      for (const p of players) {
        const scores = Array.isArray(p.scores) ? p.scores : [];
        let thru = 0;
        let toPar = 0;
        for (let i = 0; i < scores.length; i++) {
          const s = scores[i];
          const par = pars[i];
          if (typeof s === "number" && s > 0 && typeof par === "number") {
            thru += 1;
            toPar += s - par;
          }
        }
        if (thru === 0) continue;
        const key = (p.id && p.id.length > 0 ? p.id : p.name || "").trim();
        if (!key) continue;
        const existing = byPlayer.get(key);
        if (existing) {
          existing.thru_holes += thru;
          existing.score_to_par += toPar;
        } else {
          byPlayer.set(key, {
            player_id: key,
            player_name: p.name || "Unknown",
            thru_holes: thru,
            score_to_par: toPar,
          });
        }
      }
    }

    const ranked = Array.from(byPlayer.values()).sort((a, b) => {
      if (a.score_to_par !== b.score_to_par) {
        return a.score_to_par - b.score_to_par;
      }
      return b.thru_holes - a.thru_holes;
    });

    liveScoreboard = ranked.map((row, idx) => ({
      ...row,
      position: idx + 1,
    }));
  } catch (err) {
    console.error("[today] live_scoreboard query failed:", err);
    liveScoreboard = [];
  }

  // ─── recent_photos ──────────────────────────────────────────
  // No photos DB table exists yet; return empty array. When a photos
  // model is introduced we'll wire it in here.
  const recentPhotos: TodayPayload["recent_photos"] = [];

  // ─── members ────────────────────────────────────────────────
  const members: TodayPayload["members"] = (trip.members as MemberRow[]).map(
    (m: MemberRow) => ({
      id: m.id,
      name: m.name,
      handicap: Number(m.handicap),
      role: m.role,
      rsvp_status: m.rsvp_status,
      avatar_url: m.user?.avatar_url || null,
    })
  );

  const captain: TodayPayload["captain"] = trip.creator
    ? {
        id: trip.creator.id,
        full_name: trip.creator.full_name,
        avatar_url: trip.creator.avatar_url,
      }
    : null;

  const payload: TodayPayload = {
    trip: {
      id: trip.id,
      name: trip.name,
      destination: trip.destination,
      start_date: trip.start_date,
      end_date: trip.end_date,
      state,
      day_number: dayNumber,
      days_until_start: daysUntilStart,
      unlocked: true,
    },
    captain,
    members,
    today_schedule: todaySchedule,
    live_scoreboard: liveScoreboard,
    recent_photos: recentPhotos,
    first_birdie_fired_at: null,
  };

  return NextResponse.json(payload);
}
