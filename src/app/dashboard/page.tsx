"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { getTrips, createTrip, deleteTrip } from "@/lib/store";
import { Trip } from "@/lib/types";
import {
  MapPin,
  Trophy,
  Users,
  Calendar,
  Trash2,
  AlertCircle,
  Wind,
  ChevronRight,
  Star,
  DollarSign,
  Clock,
  CloudSun,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types for dashboard API response
// ---------------------------------------------------------------------------
interface DashboardPlayer {
  id: string;
  name: string;
  avatarUrl?: string | null;
}

interface UpcomingRound {
  id: string;
  courseName: string;
  coursePhotoUrl: string | null;
  courseLocation: string | null;
  teeTime: string;
  weather: {
    temp?: number;
    icon?: string;
    wind?: number;
    description?: string;
  } | null;
  players: DashboardPlayer[];
}

interface RecentScore {
  roundId: string;
  courseName: string;
  score: number;
  par: number | null;
  moneyNet: number;
  date: string;
  isPersonalBest: boolean;
}

interface SettlementItem {
  fromUser?: string;
  toUser?: string;
  amount: number;
  roundNote: string | null;
}

interface DashboardData {
  user: { firstName: string; venmoUsername: string | null };
  upcomingRound: UpcomingRound | null;
  recentScores: RecentScore[];
  settlements: {
    owed: SettlementItem[];
    owing: SettlementItem[];
    totalOwed: number;
    totalOwing: number;
  };
  seasonStats: {
    totalMoneyNet: number;
    roundsThisMonth: number;
    scoringAvg: number | null;
  };
  _errors?: string[];
}

const EMPTY_DASHBOARD: DashboardData = {
  user: { firstName: "Golfer", venmoUsername: null },
  upcomingRound: null,
  recentScores: [],
  settlements: { owed: [], owing: [], totalOwed: 0, totalOwing: 0 },
  seasonStats: { totalMoneyNet: 0, roundsThisMonth: 0, scoringAvg: null },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function formatTeeTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatShortDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function moneyStr(n: number): string {
  const sign = n >= 0 ? "+" : "-";
  return `${sign}$${Math.abs(n).toFixed(0)}`;
}

// ---------------------------------------------------------------------------
// Skeleton components
// ---------------------------------------------------------------------------
function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-[#242424] ${className ?? ""}`}
    />
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="space-y-2">
        <SkeletonBlock className="h-8 w-56" />
        <SkeletonBlock className="h-5 w-40" />
      </div>
      {/* CTA cards */}
      <div className="flex gap-4 overflow-x-auto">
        <SkeletonBlock className="h-24 w-full min-w-[160px] shrink-0 sm:w-1/2" />
        <SkeletonBlock className="h-24 w-full min-w-[160px] shrink-0 sm:w-1/2" />
      </div>
      {/* Upcoming */}
      <SkeletonBlock className="h-48 w-full" />
      {/* Recent scores */}
      <div className="space-y-3">
        <SkeletonBlock className="h-5 w-32" />
        <SkeletonBlock className="h-16 w-full" />
        <SkeletonBlock className="h-16 w-full" />
        <SkeletonBlock className="h-16 w-full" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------
export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Trip creation form state
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [destination, setDestination] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        router.push("/login");
        return;
      }

      // Check for pending invite redirect
      const pendingInvite = sessionStorage.getItem("pendingInvite");
      if (pendingInvite) {
        sessionStorage.removeItem("pendingInvite");
        router.push(`/invite/${pendingInvite}`);
        return;
      }

      let dashData: DashboardData = EMPTY_DASHBOARD;
      let tripsData: Trip[] = [];

      try {
        const [dashRes, t] = await Promise.all([
          fetch("/api/dashboard"),
          getTrips().catch(() => [] as Trip[]),
        ]);
        tripsData = t;

        if (dashRes.ok) {
          dashData = await dashRes.json();
        }
      } catch {
        // Network failure — show empty dashboard, not an error screen
        console.error("[Dashboard] Failed to fetch dashboard data");
      }

      setData(dashData);
      setTrips(tripsData);
      setLoading(false);
    });
  }, [router]);

  // --- Trip CRUD ---
  async function handleCreateTrip(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setError(null);
    try {
      await createTrip({
        name: name.trim(),
        destination: destination.trim(),
        startDate,
        endDate,
      });
      setName("");
      setDestination("");
      setStartDate("");
      setEndDate("");
      setShowForm(false);
      setTrips(await getTrips());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create trip");
    }
  }

  async function handleDeleteTrip(tripId: string) {
    setError(null);
    try {
      await deleteTrip(tripId);
      setTrips(await getTrips());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete trip");
    }
  }

  // --- Derived values ---
  const greeting = getGreeting();
  const seasonLine = (() => {
    if (!data?.seasonStats) return null;
    const { totalMoneyNet, roundsThisMonth } = data.seasonStats;
    if (totalMoneyNet > 0)
      return {
        text: `You're up $${Math.abs(totalMoneyNet).toFixed(0)} this season`,
        color: "text-emerald-400",
      };
    if (totalMoneyNet < 0)
      return {
        text: `You're down $${Math.abs(totalMoneyNet).toFixed(0)} this season`,
        color: "text-red-400",
      };
    if (roundsThisMonth > 0)
      return {
        text: `${roundsThisMonth} round${roundsThisMonth !== 1 ? "s" : ""} this month`,
        color: "text-zinc-400",
      };
    return { text: "Let's get out on the course", color: "text-zinc-400" };
  })();

  const hasSettlements =
    data &&
    ((data.settlements?.owed?.length ?? 0) > 0 ||
      (data.settlements?.owing?.length ?? 0) > 0);

  // --- Render ---
  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#1A1A1A] px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-2xl space-y-8">
        {/* Error Banner */}
        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-red-800 bg-red-950/50 px-4 py-3 text-sm text-red-300">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {loading || !data ? (
          <DashboardSkeleton />
        ) : (
          <>
            {/* ── Section 1: Greeting ─────────────────────────── */}
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-[#F3EDE4]">
                {greeting}, {data.user.firstName}.
              </h1>
              {seasonLine && (
                <p className={`mt-1 text-sm font-medium ${seasonLine.color}`}>
                  {seasonLine.text}
                </p>
              )}
            </div>

            {/* ── Section 2: CTA Cards ────────────────────────── */}
            <div className="flex gap-4 overflow-x-auto pb-1 sm:grid sm:grid-cols-2 sm:overflow-visible">
              <Link
                href="/trips/new"
                className="flex min-w-[160px] flex-1 shrink-0 items-center gap-3 rounded-xl bg-[#D94F2B] px-5 py-4 transition-opacity hover:opacity-90"
              >
                <MapPin className="h-6 w-6 text-white/80" />
                <div>
                  <p className="text-sm font-bold text-white">Plan a Trip</p>
                  <p className="text-xs text-white/70">Organize a getaway</p>
                </div>
              </Link>
              <Link
                href="/rounds/new"
                className="flex min-w-[160px] flex-1 shrink-0 items-center gap-3 rounded-xl border border-zinc-700 bg-[#242424] px-5 py-4 transition-colors hover:border-zinc-600"
              >
                <Trophy className="h-6 w-6 text-[#F3EDE4]/70" />
                <div>
                  <p className="text-sm font-bold text-[#F3EDE4]">
                    Track a Round
                  </p>
                  <p className="text-xs text-zinc-400">Score &amp; settle up</p>
                </div>
              </Link>
            </div>

            {/* ── Section 3: Upcoming Round ───────────────────── */}
            {data.upcomingRound ? (
              <UpcomingRoundCard round={data.upcomingRound} />
            ) : (
              <Link
                href="/rounds/new"
                className="flex items-center justify-between rounded-xl border border-zinc-800 bg-[#242424] px-5 py-5 transition-colors hover:border-zinc-700"
              >
                <div>
                  <p className="text-sm font-semibold text-[#F3EDE4]">
                    No rounds scheduled
                  </p>
                  <p className="mt-0.5 text-xs text-zinc-400">
                    Track your next one
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-zinc-500" />
              </Link>
            )}

            {/* ── Partial load warning ──────────────────────── */}
            {data._errors && data._errors.length > 0 && (
              <div className="flex items-center gap-2 rounded-lg border border-yellow-800/50 bg-yellow-950/30 px-4 py-2.5 text-xs text-yellow-400/80">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                Some data couldn&apos;t load. Pull to refresh.
              </div>
            )}

            {/* ── Section 4: Recent Scores ────────────────────── */}
            {(data.recentScores?.length ?? 0) > 0 && (
              <div>
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-400">
                  Recent Scores
                </h2>
                <div className="space-y-2">
                  {data.recentScores.map((rs) => (
                    <Link
                      key={rs.roundId}
                      href={`/rounds/${rs.roundId}`}
                      className="flex items-center justify-between rounded-xl border border-zinc-800 bg-[#242424] px-4 py-3 transition-colors hover:border-zinc-700"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-semibold text-[#F3EDE4]">
                            {rs.courseName}
                          </p>
                          {rs.isPersonalBest && (
                            <span className="flex items-center gap-0.5 rounded-full bg-amber-900/40 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-400">
                              <Star className="h-3 w-3" /> PB
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-xs text-zinc-500">
                          {formatShortDate(rs.date)}
                        </p>
                      </div>
                      <div className="flex items-center gap-4 pl-4">
                        <span className="text-lg font-bold text-[#F3EDE4]">
                          {rs.score}
                          {rs.par !== null && (
                            <span className="ml-1 text-xs font-normal text-zinc-500">
                              ({rs.score - rs.par >= 0 ? "+" : ""}
                              {rs.score - rs.par})
                            </span>
                          )}
                        </span>
                        {rs.moneyNet !== 0 && (
                          <span
                            className={`text-sm font-semibold ${rs.moneyNet > 0 ? "text-emerald-400" : "text-red-400"}`}
                          >
                            {moneyStr(rs.moneyNet)}
                          </span>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* ── Section 5: Settlement Banner ────────────────── */}
            {hasSettlements && (
              <div className="rounded-xl border border-zinc-800 bg-[#242424] p-5">
                <div className="space-y-3">
                  {(data.settlements?.totalOwed ?? 0) > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-emerald-400">
                        You&apos;re owed ${(data.settlements?.totalOwed ?? 0).toFixed(0)}
                      </p>
                      <div className="mt-1 space-y-0.5">
                        {(data.settlements?.owed ?? []).map((s, i) => (
                          <p key={i} className="text-xs text-zinc-400">
                            {s.fromUser} owes you ${s.amount.toFixed(0)}
                            {s.roundNote ? ` - ${s.roundNote}` : ""}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                  {(data.settlements?.totalOwing ?? 0) > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-red-400">
                        You owe ${(data.settlements?.totalOwing ?? 0).toFixed(0)}
                      </p>
                      <div className="mt-1 space-y-0.5">
                        {(data.settlements?.owing ?? []).map((s, i) => (
                          <p key={i} className="text-xs text-zinc-400">
                            You owe {s.toUser} ${s.amount.toFixed(0)}
                            {s.roundNote ? ` - ${s.roundNote}` : ""}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <Link
                  href="/settlements"
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#D94F2B] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                >
                  <DollarSign className="h-4 w-4" />
                  Settle Up
                </Link>
              </div>
            )}

            {/* ── Section 6: Trips ────────────────────────────── */}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
                  Your Trips
                </h2>
                <button
                  onClick={() => setShowForm((v) => !v)}
                  className="text-xs font-semibold text-[#D94F2B] hover:underline"
                >
                  {showForm ? "Cancel" : "+ New Trip"}
                </button>
              </div>

              {/* Create trip form */}
              {showForm && (
                <form
                  onSubmit={handleCreateTrip}
                  className="mb-4 rounded-xl border border-zinc-800 bg-[#242424] p-5"
                >
                  <h3 className="text-sm font-semibold text-[#F3EDE4]">
                    Create a New Trip
                  </h3>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-medium text-zinc-400">
                        Trip Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Scottsdale 2026"
                        className="mt-1 block w-full rounded-lg border border-zinc-700 bg-[#1A1A1A] px-3 py-2 text-sm text-[#F3EDE4] placeholder:text-zinc-600 focus:border-[#D94F2B] focus:outline-none focus:ring-1 focus:ring-[#D94F2B]/30"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-400">
                        Destination
                      </label>
                      <input
                        type="text"
                        value={destination}
                        onChange={(e) => setDestination(e.target.value)}
                        placeholder="Scottsdale, AZ"
                        className="mt-1 block w-full rounded-lg border border-zinc-700 bg-[#1A1A1A] px-3 py-2 text-sm text-[#F3EDE4] placeholder:text-zinc-600 focus:border-[#D94F2B] focus:outline-none focus:ring-1 focus:ring-[#D94F2B]/30"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-400">
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="mt-1 block w-full rounded-lg border border-zinc-700 bg-[#1A1A1A] px-3 py-2 text-sm text-[#F3EDE4] focus:border-[#D94F2B] focus:outline-none focus:ring-1 focus:ring-[#D94F2B]/30"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-400">
                        End Date
                      </label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="mt-1 block w-full rounded-lg border border-zinc-700 bg-[#1A1A1A] px-3 py-2 text-sm text-[#F3EDE4] focus:border-[#D94F2B] focus:outline-none focus:ring-1 focus:ring-[#D94F2B]/30"
                      />
                    </div>
                  </div>
                  <div className="mt-4 flex gap-3">
                    <button
                      type="submit"
                      className="rounded-lg bg-[#D94F2B] px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                    >
                      Create Trip
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="rounded-lg border border-zinc-700 px-5 py-2 text-sm font-medium text-zinc-400 transition-colors hover:border-zinc-600"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {trips.length === 0 ? (
                <div className="rounded-xl border border-zinc-800 bg-[#242424] px-5 py-10 text-center">
                  <MapPin className="mx-auto h-10 w-10 text-zinc-600" />
                  <p className="mt-3 text-sm font-medium text-zinc-400">
                    No trips yet
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    Create your first golf trip to get started.
                  </p>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {trips.map((trip) => (
                    <div
                      key={trip.id}
                      className="group relative rounded-xl border border-zinc-800 bg-[#242424] p-4 transition-colors hover:border-zinc-700"
                    >
                      <button
                        onClick={() => handleDeleteTrip(trip.id)}
                        className="absolute right-3 top-3 rounded-md p-1.5 text-zinc-600 opacity-0 transition-all hover:bg-red-950/50 hover:text-red-400 group-hover:opacity-100"
                        title="Delete trip"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <Link href={`/trips/${trip.id}`} className="block">
                        <h3 className="font-semibold text-[#F3EDE4]">
                          {trip.name}
                        </h3>
                        {trip.destination && (
                          <div className="mt-1.5 flex items-center gap-1.5 text-sm text-zinc-400">
                            <MapPin className="h-3.5 w-3.5" />
                            {trip.destination}
                          </div>
                        )}
                        {(trip.startDate || trip.endDate) && (
                          <div className="mt-1 flex items-center gap-1.5 text-sm text-zinc-400">
                            <Calendar className="h-3.5 w-3.5" />
                            {trip.startDate && trip.endDate
                              ? `${trip.startDate} \u2014 ${trip.endDate}`
                              : trip.startDate || trip.endDate}
                          </div>
                        )}
                        <div className="mt-2 flex items-center gap-1.5 text-xs text-zinc-500">
                          <Users className="h-3.5 w-3.5" />
                          {trip.members.length} member
                          {trip.members.length !== 1 ? "s" : ""}
                        </div>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Upcoming Round Card (extracted for clarity)
// ---------------------------------------------------------------------------
function UpcomingRoundCard({ round }: { round: UpcomingRound }) {
  const maxVisible = 4;
  const visiblePlayers = round.players.slice(0, maxVisible);
  const overflow = round.players.length - maxVisible;

  return (
    <Link
      href={`/rounds/${round.id}`}
      className="block overflow-hidden rounded-xl border border-zinc-800 transition-colors hover:border-zinc-700"
    >
      {/* Banner */}
      {round.coursePhotoUrl ? (
        <div className="relative h-32 w-full">
          <Image
            src={round.coursePhotoUrl}
            alt={round.courseName}
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#242424] to-transparent" />
        </div>
      ) : (
        <div className="h-24 w-full bg-gradient-to-r from-emerald-900 to-emerald-700" />
      )}

      {/* Content */}
      <div className="bg-[#242424] px-5 pb-4 pt-3 -mt-6 relative">
        <p className="text-base font-bold text-[#F3EDE4]">
          {round.courseName}
        </p>
        {round.courseLocation && (
          <p className="mt-0.5 flex items-center gap-1 text-xs text-zinc-400">
            <MapPin className="h-3 w-3" />
            {round.courseLocation}
          </p>
        )}

        <div className="mt-2 flex items-center gap-4">
          <span className="flex items-center gap-1 text-xs text-zinc-400">
            <Clock className="h-3 w-3" />
            {formatTeeTime(round.teeTime)}
          </span>

          {/* Weather */}
          {round.weather && round.weather.temp !== undefined && (
            <span className="flex items-center gap-1 text-xs text-zinc-400">
              <CloudSun className="h-3 w-3" />
              {Math.round(round.weather.temp)}&deg;
              {round.weather.wind !== undefined && (
                <>
                  <Wind className="ml-1 h-3 w-3" />
                  {Math.round(round.weather.wind)} mph
                </>
              )}
            </span>
          )}
        </div>

        {/* Player pills */}
        {round.players.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {visiblePlayers.map((p) => (
              <span
                key={p.id}
                className="rounded-full bg-[#1A1A1A] px-2.5 py-0.5 text-xs font-medium text-zinc-300"
              >
                {p.name}
              </span>
            ))}
            {overflow > 0 && (
              <span className="rounded-full bg-[#1A1A1A] px-2.5 py-0.5 text-xs font-medium text-zinc-500">
                +{overflow}
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
