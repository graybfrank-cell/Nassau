"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { getTrips, createTrip, deleteTrip } from "@/lib/store";
import { getGameRounds } from "@/lib/game-store";
import { Trip, GameRound } from "@/lib/types";
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
  const [recentRounds, setRecentRounds] = useState<GameRound[]>([]);
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
      if (user) {
        const pendingInvite = sessionStorage.getItem("pendingInvite");
        if (pendingInvite) {
          sessionStorage.removeItem("pendingInvite");
          router.push(`/invite/${pendingInvite}`);
          return;
        }
        const [t, r] = await Promise.all([getTrips(), getGameRounds()]);
        setTrips(t);
        setRecentRounds(r.slice(0, 3));
      } else {
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
      await createTrip({ name: name.trim(), destination: destination.trim(), startDate, endDate });
      setName(""); setDestination(""); setStartDate(""); setEndDate("");
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

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-zinc-950">
        <p className="text-sm text-zinc-400">Loading...</p>
      </div>
    );
  }

  // --- Render ---
  return (
    <div className="min-h-[calc(100vh-64px)] bg-zinc-950 px-6 py-10">
      <div className="mx-auto max-w-5xl">
        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-800 bg-red-950 px-4 py-3 text-sm text-red-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">My Trips</h1>
            <p className="mt-1 text-sm text-zinc-400">Plan and manage your golf getaways.</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/rounds/new" className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-zinc-300 transition-colors hover:bg-zinc-800">
              <Trophy className="h-4 w-4" />
              Quick Round
            </Link>
            <Link href="/trips/new" className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-colors" style={{ backgroundColor: "#D94F2B" }}>
              <Plus className="h-4 w-4" />
              New Trip
            </Link>
          </div>
        </div>

        {showForm && (
          <form onSubmit={handleCreateTrip} className="mt-6 rounded-xl border border-zinc-800 bg-zinc-900 p-6">
            <h2 className="text-lg font-semibold text-white">Create a New Trip</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {[
                { label: "Trip Name *", value: name, setter: setName, placeholder: "Scottsdale 2026", required: true },
                { label: "Destination", value: destination, setter: setDestination, placeholder: "Scottsdale, AZ", required: false },
              ].map((field) => (
                <div key={field.label}>
                  <label className="block text-sm font-medium text-zinc-300">{field.label}</label>
                  <input type="text" required={field.required} value={field.value} onChange={(e) => field.setter(e.target.value)} placeholder={field.placeholder}
                    className="mt-1 block w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:border-[#D94F2B] focus:outline-none focus:ring-2 focus:ring-[#D94F2B]/20" />
                </div>
              ))}
              {[
                { label: "Start Date", value: startDate, setter: setStartDate },
                { label: "End Date", value: endDate, setter: setEndDate },
              ].map((field) => (
                <div key={field.label}>
                  <label className="block text-sm font-medium text-zinc-300">{field.label}</label>
                  <input type="date" value={field.value} onChange={(e) => field.setter(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white focus:border-[#D94F2B] focus:outline-none focus:ring-2 focus:ring-[#D94F2B]/20" />
                </div>
              ))}
            </div>
            <div className="mt-6 flex gap-3">
              <button type="submit" className="rounded-lg px-5 py-2 text-sm font-semibold text-white transition-colors" style={{ backgroundColor: "#D94F2B" }}>
                Create Trip
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border border-zinc-700 px-5 py-2 text-sm font-medium text-zinc-400 transition-colors hover:bg-zinc-800">
                Cancel
              </button>
            </div>
          </form>
        )}

        {recentRounds.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Recent Rounds</h2>
              <Link href="/rounds" className="text-sm font-medium text-[#D94F2B] hover:text-[#B83D25]">
                View All &rarr;
              </Link>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {recentRounds.map((round) => {
                const bestScore = round.scorecards
                  .filter((sc: any) => sc.total && sc.total > 0)
                  .sort((a: any, b: any) => (a.total || 999) - (b.total || 999))[0];
                return (
                  <Link key={round.id} href={`/rounds/${round.id}`}
                    className="rounded-lg border border-zinc-800 bg-zinc-900 p-4 transition-shadow hover:border-zinc-700">
                    <p className="text-sm font-semibold text-white">{round.courseName}</p>
                    <p className="mt-1 text-xs text-zinc-500">
                      {new Date(round.teeTime).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </p>
                    {bestScore && (
                      <p className="mt-1 text-xs text-[#D94F2B]">Low: {bestScore.total}</p>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
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
