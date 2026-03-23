"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import {
  MapPin,
  Trophy,
  Plus,
  Wind,
  ChevronRight,
  Star,
  DollarSign,
  CloudSun,
  TrendingUp,
  TrendingDown,
  Flame,
  Target,
  Check,
  Award,
  Flag,
} from "lucide-react";
import type {
  DashboardData,
  UpcomingRound,
  RecentScore,
  HeadToHeadOpponent,
  CourseHistoryEntry,
  AwardCount,
} from "@/types/dashboard";

const EMPTY_DASHBOARD: DashboardData = {
  user: { fullName: "Golfer", firstName: "Golfer", venmoUsername: null },
  upcomingRound: null,
  recentScores: [],
  settlements: { owed: [], owing: [], totalOwed: 0, totalOwing: 0 },
  seasonStats: { totalMoneyNet: 0, roundsThisMonth: 0, scoringAvg: null },
  lifetimeStats: {
    totalRounds: 0,
    allTimePnl: 0,
    bestScore: null,
    avgScore: null,
    totalSkinsWon: 0,
    totalMoneyWon: 0,
  },
  recentRounds: [],
  headToHead: [],
  courseHistory: [],
  upcomingRounds: [],
  awards: [],
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

function getTagline(): string {
  const lines = [
    "Ready to run it?",
    "Let's get after it.",
    "Time to collect.",
    "Who owes you money?",
    "Fairways and paydays.",
  ];
  // Rotate daily so it feels fresh but not random per render
  const day = Math.floor(Date.now() / 86400000);
  return lines[day % lines.length];
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

function getCountdown(iso: string): string {
  const diff = new Date(iso).getTime() - Date.now();
  if (diff < 0) return "Tee time passed";
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  if (days > 0) return `Tee time in ${days} day${days !== 1 ? "s" : ""}`;
  if (hours > 0) return `Tee time in ${hours} hour${hours !== 1 ? "s" : ""}`;
  const mins = Math.floor(diff / (1000 * 60));
  return `Tee time in ${mins} min`;
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------
function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-zinc-800/50 ${className ?? ""}`}
    />
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <SkeletonBlock className="h-8 w-64" />
        <SkeletonBlock className="h-5 w-40" />
      </div>
      <SkeletonBlock className="h-52 w-full" />
      <div className="grid gap-3 sm:grid-cols-3">
        <SkeletonBlock className="h-24" />
        <SkeletonBlock className="h-24" />
        <SkeletonBlock className="h-24" />
      </div>
      <SkeletonBlock className="h-16 w-full" />
      <div className="space-y-3">
        <SkeletonBlock className="h-5 w-32" />
        <SkeletonBlock className="h-20 w-full" />
        <SkeletonBlock className="h-20 w-full" />
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
  const [loading, setLoading] = useState(true);

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
      try {
        const res = await fetch("/api/dashboard");
        if (res.ok) {
          dashData = await res.json();
        }
      } catch {
        console.error("[Dashboard] Failed to fetch dashboard data");
      }

      setData(dashData);
      setLoading(false);
    });
  }, [router]);

  if (loading || !data) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-zinc-950 px-4 py-10 sm:px-6">
        <div className="mx-auto max-w-4xl">
          <DashboardSkeleton />
        </div>
      </div>
    );
  }

  const netBalance = data.settlements.totalOwed - data.settlements.totalOwing;
  const hasSettlements =
    data.settlements.totalOwed > 0 || data.settlements.totalOwing > 0;

  return (
    <div className="min-h-[calc(100vh-64px)] bg-zinc-950 px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-4xl">
        {/* ── Personalized Greeting ── */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              {getGreeting()}, {data.user.fullName}.
            </h1>
            <p className="mt-1 text-sm text-zinc-400">{getTagline()}</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/rounds/new"
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm font-semibold text-zinc-300 transition-colors hover:bg-zinc-800"
            >
              <Trophy className="h-4 w-4" />
              <span className="hidden sm:inline">Quick Round</span>
            </Link>
            <Link
              href="/trips/new"
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#D94F2B] px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#c4442a]"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">New Trip</span>
            </Link>
          </div>
        </div>

        {/* ── Subscription upsell ── */}
        {!data.subscriptionActive && (
          <div className="mt-6 flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/60 px-4 py-3">
            <p className="text-sm text-zinc-400">
              Your one free trip is active &mdash; upgrade for unlimited.
            </p>
            <Link
              href="/pricing"
              className="shrink-0 rounded-md bg-[#D94F2B] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#c4442a]"
            >
              View Plans
            </Link>
          </div>
        )}

        {/* ── Upcoming Round ── */}
        {data.upcomingRound && (
          <UpcomingRoundCard round={data.upcomingRound} />
        )}

        {/* ── Season Stats Row ── */}
        <div className="mt-6 grid grid-cols-3 gap-3">
          <StatCard
            label="Season P&L"
            value={moneyStr(data.seasonStats.totalMoneyNet)}
            positive={data.seasonStats.totalMoneyNet >= 0}
            icon={
              data.seasonStats.totalMoneyNet >= 0 ? (
                <TrendingUp className="h-4 w-4 text-emerald-400" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-400" />
              )
            }
          />
          <StatCard
            label="Scoring Avg"
            value={
              data.seasonStats.scoringAvg
                ? data.seasonStats.scoringAvg.toFixed(1)
                : "—"
            }
            icon={<Target className="h-4 w-4 text-zinc-500" />}
          />
          <StatCard
            label="Rounds This Month"
            value={String(data.seasonStats.roundsThisMonth)}
            icon={<Flame className="h-4 w-4 text-[#D94F2B]" />}
          />
        </div>

        {/* ── Settlement Banner ── */}
        {hasSettlements && (
          <SettlementBanner
            settlements={data.settlements}
            venmoUsername={data.user.venmoUsername}
          />
        )}

        {/* ── Recent Rounds ── */}
        {data.recentScores.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">
                Recent Rounds
              </h2>
              <Link
                href="/rounds"
                className="text-sm font-medium text-[#D94F2B] hover:text-[#c4442a]"
              >
                View All <ChevronRight className="inline h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="mt-3 space-y-2">
              {data.recentScores.map((score) => (
                <RecentRoundRow key={score.roundId} score={score} />
              ))}
            </div>
          </div>
        )}

        {/* ── Venmo Username ── */}
        <VenmoUsernameCard
          venmoUsername={data.user.venmoUsername}
          onSave={(username) =>
            setData((prev) =>
              prev
                ? { ...prev, user: { ...prev.user, venmoUsername: username } }
                : prev
            )
          }
        />

        {/* ── Lifetime Stats ── */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-white">Lifetime Stats</h2>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard
              label="Total Rounds"
              value={String(data.lifetimeStats.totalRounds)}
              icon={<Flag className="h-4 w-4 text-zinc-500" />}
            />
            <StatCard
              label="Best Score"
              value={data.lifetimeStats.bestScore !== null ? String(data.lifetimeStats.bestScore) : "—"}
              icon={<Star className="h-4 w-4 text-amber-400" />}
            />
            <StatCard
              label="All-Time P&L"
              value={moneyStr(data.lifetimeStats.allTimePnl)}
              positive={data.lifetimeStats.allTimePnl >= 0}
              icon={
                data.lifetimeStats.allTimePnl >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-emerald-400" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-400" />
                )
              }
            />
            <StatCard
              label="Skins Won"
              value={String(data.lifetimeStats.totalSkinsWon)}
              icon={<DollarSign className="h-4 w-4 text-emerald-400" />}
            />
          </div>
        </div>

        {/* ── Course History ── */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-white">Your Courses</h2>
          {data.courseHistory.length > 0 ? (
            <div className="mt-3 space-y-2">
              {data.courseHistory.map((course) => (
                <CourseHistoryRow key={course.courseName} course={course} />
              ))}
            </div>
          ) : (
            <EmptyState message="Play your first round to start tracking" />
          )}
        </div>

        {/* ── Head-to-Head Rivalries ── */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-white">Your Rivalries</h2>
          {data.headToHead.length > 0 ? (
            <div className="mt-3 space-y-2">
              {data.headToHead.map((opponent) => (
                <HeadToHeadRow key={opponent.opponentName} opponent={opponent} />
              ))}
            </div>
          ) : (
            <EmptyState message="Complete rounds to see your rivalries" />
          )}
        </div>

        {/* ── Awards Shelf ── */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-white">Your Awards</h2>
          {data.awards.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {data.awards.map((award) => (
                <AwardBadge key={award.name} award={award} />
              ))}
            </div>
          ) : (
            <EmptyState message="Win awards by completing rounds" />
          )}
        </div>

        {/* ── Quick Links ── */}
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <Link
            href="/trips"
            className="group flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 transition-colors hover:border-zinc-700"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-800 text-zinc-400 group-hover:text-white">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">My Trips</p>
              <p className="text-xs text-zinc-500">
                Plan and manage your golf getaways
              </p>
            </div>
            <ChevronRight className="ml-auto h-4 w-4 text-zinc-600 group-hover:text-zinc-400" />
          </Link>
          <Link
            href="/rounds"
            className="group flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 transition-colors hover:border-zinc-700"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-800 text-zinc-400 group-hover:text-white">
              <Trophy className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">All Rounds</p>
              <p className="text-xs text-zinc-500">
                Scores, skins, and Nassau bets
              </p>
            </div>
            <ChevronRight className="ml-auto h-4 w-4 text-zinc-600 group-hover:text-zinc-400" />
          </Link>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Upcoming Round Card
// ---------------------------------------------------------------------------
function UpcomingRoundCard({ round }: { round: UpcomingRound }) {
  const maxVisible = 4;
  const visiblePlayers = round.players.slice(0, maxVisible);
  const overflow = round.players.length - maxVisible;

  return (
    <Link
      href={`/rounds/${round.id}`}
      className="mt-6 block overflow-hidden rounded-xl border border-zinc-800 transition-colors hover:border-zinc-700"
    >
      {/* Banner image */}
      {round.coursePhotoUrl ? (
        <div className="relative h-36 w-full sm:h-44">
          <Image
            src={round.coursePhotoUrl}
            alt={round.courseName}
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
        </div>
      ) : (
        <div className="h-28 w-full bg-gradient-to-r from-emerald-900 to-emerald-700" />
      )}

      {/* Content */}
      <div className="relative -mt-10 bg-gradient-to-t from-zinc-900 to-transparent px-5 pb-5 pt-12">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#D94F2B]">
              Next Up
            </p>
            <h3 className="mt-1 text-lg font-bold text-white">
              {round.courseName}
            </h3>
            {round.courseLocation && (
              <p className="mt-0.5 flex items-center gap-1 text-xs text-zinc-400">
                <MapPin className="h-3 w-3" />
                {round.courseLocation}
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="text-xs font-medium text-zinc-400">
              {formatTeeTime(round.teeTime)}
            </p>
            <p className="mt-0.5 text-xs font-semibold text-[#D94F2B]">
              {getCountdown(round.teeTime)}
            </p>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-4">
          {/* Weather */}
          {round.weather && round.weather.temp !== undefined && (
            <span className="flex items-center gap-1.5 text-xs text-zinc-400">
              <CloudSun className="h-3.5 w-3.5" />
              {Math.round(round.weather.temp)}&deg;F
              {round.weather.wind !== undefined && (
                <>
                  {" "}
                  &middot;{" "}
                  <Wind className="h-3 w-3" />
                  {Math.round(round.weather.wind)} mph
                </>
              )}
            </span>
          )}
        </div>

        {/* Player avatars */}
        {round.players.length > 0 && (
          <div className="mt-3 flex items-center gap-1.5">
            {visiblePlayers.map((p) => (
              <span
                key={p.id}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-800 text-[10px] font-bold uppercase text-zinc-300 ring-2 ring-zinc-900"
                title={p.name}
              >
                {p.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)}
              </span>
            ))}
            {overflow > 0 && (
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-800 text-[10px] font-medium text-zinc-500 ring-2 ring-zinc-900">
                +{overflow}
              </span>
            )}
            <span className="ml-2 text-xs text-zinc-500">
              {round.players.length} player
              {round.players.length !== 1 ? "s" : ""}
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Stat Card
// ---------------------------------------------------------------------------
function StatCard({
  label,
  value,
  icon,
  positive,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  positive?: boolean;
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
      <div className="flex items-center gap-1.5">
        {icon}
        <span className="text-xs font-medium text-zinc-500">{label}</span>
      </div>
      <p
        className={`mt-1 text-xl font-bold tracking-tight ${
          positive === true
            ? "text-emerald-400"
            : positive === false
              ? "text-red-400"
              : "text-white"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Settlement Banner
// ---------------------------------------------------------------------------
function SettlementBanner({
  settlements,
  venmoUsername,
}: {
  settlements: DashboardData["settlements"];
  venmoUsername: string | null;
}) {
  const net = settlements.totalOwed - settlements.totalOwing;
  const isPositive = net >= 0;

  return (
    <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-lg ${
              isPositive ? "bg-emerald-950 text-emerald-400" : "bg-red-950 text-red-400"
            }`}
          >
            <DollarSign className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-zinc-500">
              Outstanding Balance
            </p>
            <p
              className={`text-lg font-bold ${
                isPositive ? "text-emerald-400" : "text-red-400"
              }`}
            >
              {isPositive ? "+" : "-"}${Math.abs(net).toFixed(2)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {settlements.totalOwed > 0 && (
            <span className="text-xs text-zinc-500">
              Owed to you: ${settlements.totalOwed.toFixed(2)}
            </span>
          )}
          {settlements.totalOwing > 0 && (
            <span className="text-xs text-zinc-500">
              You owe: ${settlements.totalOwing.toFixed(2)}
            </span>
          )}
        </div>
      </div>
      {/* Settlement details */}
      {(settlements.owed.length > 0 || settlements.owing.length > 0) && (
        <div className="mt-3 space-y-1.5">
          {settlements.owing.map((s, i) => (
            <div
              key={`owing-${i}`}
              className="flex items-center justify-between rounded-lg bg-zinc-800/50 px-3 py-2"
            >
              <span className="text-xs text-zinc-400">
                You owe <span className="font-medium text-zinc-300">{s.toUser}</span>
                {s.roundNote && (
                  <span className="text-zinc-600"> &middot; {s.roundNote}</span>
                )}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-red-400">
                  ${s.amount.toFixed(2)}
                </span>
                {venmoUsername && (
                  <a
                    href={`venmo://paycharge?txn=pay&amount=${s.amount.toFixed(2)}`}
                    className="rounded-md bg-[#D94F2B] px-2 py-0.5 text-[10px] font-bold text-white hover:bg-[#c4442a]"
                  >
                    Pay
                  </a>
                )}
              </div>
            </div>
          ))}
          {settlements.owed.map((s, i) => (
            <div
              key={`owed-${i}`}
              className="flex items-center justify-between rounded-lg bg-zinc-800/50 px-3 py-2"
            >
              <span className="text-xs text-zinc-400">
                <span className="font-medium text-zinc-300">{s.fromUser}</span>{" "}
                owes you
                {s.roundNote && (
                  <span className="text-zinc-600"> &middot; {s.roundNote}</span>
                )}
              </span>
              <span className="text-xs font-semibold text-emerald-400">
                ${s.amount.toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      )}
      <Link
        href="/settlements"
        className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-[#D94F2B] hover:text-[#c4442a]"
      >
        View all settlements
        <ChevronRight className="h-3 w-3" />
      </Link>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Venmo Username Card
// ---------------------------------------------------------------------------
function VenmoUsernameCard({
  venmoUsername,
  onSave,
}: {
  venmoUsername: string | null;
  onSave: (username: string | null) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(venmoUsername || "");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/profile/venmo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ venmoUsername: value }),
      });
      if (res.ok) {
        const data: { venmoUsername: string | null } = await res.json();
        onSave(data.venmoUsername);
        setEditing(false);
      }
    } catch (err) {
      console.error("Failed to save Venmo username:", err);
    } finally {
      setSaving(false);
    }
  }

  if (!venmoUsername && !editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="mt-6 flex w-full items-center gap-3 rounded-xl border border-dashed border-zinc-700 bg-zinc-900/30 p-4 text-left transition-colors hover:border-zinc-600 hover:bg-zinc-900/50"
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-800 text-zinc-400">
          <DollarSign className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-medium text-zinc-300">
            Add your Venmo @username
          </p>
          <p className="text-xs text-zinc-500">
            Let others pay you directly after rounds
          </p>
        </div>
      </button>
    );
  }

  if (editing) {
    return (
      <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
        <p className="mb-3 text-xs font-medium text-zinc-500">Venmo Username</p>
        <div className="flex items-center gap-2">
          <span className="text-sm text-zinc-500">@</span>
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="username"
            className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-600 outline-none focus:border-[#D94F2B]"
            autoFocus
          />
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-[#D94F2B] px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#c4442a] disabled:opacity-50"
          >
            {saving ? "..." : "Save"}
          </button>
          <button
            onClick={() => {
              setEditing(false);
              setValue(venmoUsername || "");
            }}
            className="rounded-lg border border-zinc-700 px-3 py-2 text-xs font-semibold text-zinc-400 transition-colors hover:bg-zinc-800"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-950 text-emerald-400">
          <Check className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs font-medium text-zinc-500">Venmo</p>
          <p className="text-sm font-semibold text-white">@{venmoUsername}</p>
        </div>
      </div>
      <button
        onClick={() => {
          setValue(venmoUsername || "");
          setEditing(true);
        }}
        className="text-xs font-medium text-[#D94F2B] hover:text-[#c4442a]"
      >
        Edit
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Recent Round Row
// ---------------------------------------------------------------------------
function RecentRoundRow({ score }: { score: RecentScore }) {
  return (
    <Link
      href={`/rounds/${score.roundId}`}
      className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/40 px-4 py-3 transition-colors hover:border-zinc-700"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-800">
          <span className="text-sm font-bold text-white">{score.score}</span>
        </div>
        <div>
          <p className="text-sm font-medium text-white">{score.courseName}</p>
          <p className="text-xs text-zinc-500">{formatShortDate(score.date)}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {score.isPersonalBest && (
          <span className="flex items-center gap-1 rounded-full bg-amber-950/50 px-2 py-0.5 text-[10px] font-bold text-amber-400">
            <Star className="h-3 w-3" /> PB
          </span>
        )}
        <span
          className={`text-sm font-bold ${
            score.moneyNet > 0
              ? "text-emerald-400"
              : score.moneyNet < 0
                ? "text-red-400"
                : "text-zinc-500"
          }`}
        >
          {score.moneyNet !== 0 ? moneyStr(score.moneyNet) : "—"}
        </span>
        <ChevronRight className="h-4 w-4 text-zinc-600" />
      </div>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Empty State
// ---------------------------------------------------------------------------
function EmptyState({ message }: { message: string }) {
  return (
    <div className="mt-3 rounded-xl border border-dashed border-zinc-800 bg-zinc-900/30 p-6 text-center">
      <p className="text-sm text-zinc-500">{message}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Course History Row
// ---------------------------------------------------------------------------
function CourseHistoryRow({ course }: { course: CourseHistoryEntry }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/40 px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-800">
          <MapPin className="h-4 w-4 text-zinc-400" />
        </div>
        <div>
          <p className="text-sm font-medium text-white">{course.courseName}</p>
          <p className="text-xs text-zinc-500">
            {course.timesPlayed} round{course.timesPlayed !== 1 ? "s" : ""} &middot; Avg {course.avgScore}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-sm font-bold text-white">{course.bestScore}</p>
        <p className="text-[10px] font-medium text-zinc-500">Best</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Head-to-Head Row
// ---------------------------------------------------------------------------
function HeadToHeadRow({ opponent }: { opponent: HeadToHeadOpponent }) {
  const isUp = opponent.moneyBalance >= 0;
  const initials = opponent.opponentName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/40 px-4 py-3">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-800 text-xs font-bold text-zinc-300">
          {initials}
        </span>
        <div>
          <p className="text-sm font-medium text-white">{opponent.opponentName}</p>
          <p className="text-xs text-zinc-500">
            {opponent.roundsTogether} round{opponent.roundsTogether !== 1 ? "s" : ""} &middot;{" "}
            {opponent.wins}W-{opponent.losses}L
          </p>
        </div>
      </div>
      <span
        className={`text-sm font-bold ${isUp ? "text-emerald-400" : "text-red-400"}`}
      >
        {moneyStr(opponent.moneyBalance)}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Award Badge
// ---------------------------------------------------------------------------
function AwardBadge({ award }: { award: AwardCount }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-700 bg-zinc-800/60 px-3 py-1.5 text-xs font-medium text-zinc-300">
      <Award className="h-3.5 w-3.5 text-amber-400" />
      {award.name}
      {award.count > 1 && (
        <span className="font-bold text-[#D94F2B]">x{award.count}</span>
      )}
    </span>
  );
}
