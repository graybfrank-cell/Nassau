import { NextRequest, NextResponse } from "next/server";
import { getUser, getTripMembership, unauthorized, forbidden } from "@/lib/auth";
import knowledgeBase from "@/data/nassau-knowledge-base.json";

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

interface KBDest {
  id: string;
  destination: string;
  best_months: string[];
  avoid_months: string[];
  avoid_reason: string;
  price_tier: string;
}

function getNextThursday(from: Date): Date {
  const d = new Date(from);
  const day = d.getDay();
  const daysUntilThu = (4 - day + 7) % 7 || 7;
  d.setDate(d.getDate() + daysUntilThu);
  return d;
}

function getNextFriday(from: Date): Date {
  const d = new Date(from);
  const day = d.getDay();
  const daysUntilFri = (5 - day + 7) % 7 || 7;
  d.setDate(d.getDate() + daysUntilFri);
  return d;
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function toISO(d: Date): string {
  return d.toISOString().split("T")[0];
}

function getTag(monthName: string, dest: KBDest | null): string {
  if (!dest) return "📅 Available";
  const isBest = dest.best_months.includes(monthName);
  const isPeak = dest.price_tier === "premium" || dest.price_tier === "mid-high";
  if (isBest && isPeak) return "🌤️ Peak Season";
  if (isBest && !isPeak) return "💰 Best Value";
  if (isBest) return "☀️ Great Weather";
  return "📅 Available";
}

export async function GET(
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

  const { searchParams } = new URL(req.url);
  const duration = parseInt(searchParams.get("duration") || "3");
  const destination = searchParams.get("destination") || "";

  // Find KB destination match
  const destinations = (knowledgeBase as { destinations: KBDest[] }).destinations;
  const dest = destinations.find(
    (d) =>
      d.id === destination.toLowerCase().replace(/[^a-z0-9]+/g, "-") ||
      d.destination.toLowerCase().includes(destination.toLowerCase())
  ) || null;

  const bestMonths = dest?.best_months || [];
  const avoidMonths = dest?.avoid_months || [];
  const avoidReason = dest?.avoid_reason || "";

  // Generate 3 suggestions
  const today = new Date();
  const minDate = addDays(today, 21); // At least 3 weeks out

  const suggestions: { start_date: string; end_date: string; tag: string; label: string }[] = [];
  let cursor = new Date(minDate);
  let attempts = 0;

  while (suggestions.length < 3 && attempts < 60) {
    attempts++;
    // Alternate Thu and Fri starts
    const start = suggestions.length % 2 === 0
      ? getNextThursday(cursor)
      : getNextFriday(cursor);

    const monthName = MONTH_NAMES[start.getMonth()];

    // Skip avoid months
    if (avoidMonths.includes(monthName)) {
      cursor = addDays(start, 7);
      continue;
    }

    // Prefer best months if we have them
    const isBestMonth = bestMonths.length === 0 || bestMonths.includes(monthName);
    if (!isBestMonth && suggestions.length < 2 && attempts < 40) {
      cursor = addDays(start, 7);
      continue;
    }

    const end = addDays(start, duration);
    const tag = getTag(monthName, dest);
    const dayOfWeek = start.toLocaleDateString("en-US", { weekday: "short" });
    const endDayOfWeek = end.toLocaleDateString("en-US", { weekday: "short" });
    const label = `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })}-${end.toLocaleDateString("en-US", { day: "numeric" })} (${dayOfWeek}-${endDayOfWeek})`;

    suggestions.push({
      start_date: toISO(start),
      end_date: toISO(end),
      tag,
      label,
    });

    // Space at least 2-3 weeks between suggestions
    cursor = addDays(start, 14 + Math.floor(Math.random() * 7));
  }

  return NextResponse.json({
    bestMonths,
    avoidMonths,
    avoidReason,
    destination: dest?.destination || destination,
    suggestions,
  });
}
