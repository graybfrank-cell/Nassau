"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  Bell,
  Flag,
  Home,
  Trophy,
  Map,
  User,
  AlertCircle,
  ChevronRight,
  DollarSign,
} from "lucide-react";
import type { DashboardData } from "@/types/dashboard";

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
function formatCurrentDate(): string {
  const d = new Date();
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
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

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------
function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-[#27272A] ${className ?? ""}`}
    />
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-4 px-6 pt-20">
      <SkeletonBlock className="h-8 w-48" />
      <SkeletonBlock className="h-5 w-32" />
      <SkeletonBlock className="h-24 w-full" />
      <SkeletonBlock className="h-24 w-full" />
      <SkeletonBlock className="h-32 w-full" />
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
      <div
        className="min-h-screen bg-[#18181B]"
        style={{ fontFamily: "'Helvetica Neue', Arial, sans-serif" }}
      >
        <DashboardSkeleton />
      </div>
    );
  }

  const hasSettlements =
    data.settlements.totalOwed > 0 || data.settlements.totalOwing > 0;
  const firstOwing = data.settlements.owing[0];

  // Real stats from API — show actual values, "—" or "$0" when empty
  const totalRounds = data.lifetimeStats.totalRounds;
  const avgScore = data.seasonStats.scoringAvg
    ? `+${data.seasonStats.scoringAvg.toFixed(1)}`
    : "—";
  const totalWon = data.lifetimeStats.totalMoneyWon;

  // Upcoming round data
  const upcomingRound = data.upcomingRound || data.upcomingRounds[0];

  // Recent rounds: prefer recentRounds, fallback to recentScores
  const recentRoundsList: { id: string; courseName: string; date: string; score: number; moneyNet: number }[] =
    data.recentRounds.length > 0
      ? data.recentRounds.slice(0, 2).map((r) => ({
          id: r.roundId,
          courseName: r.courseName,
          date: r.date,
          score: r.score,
          moneyNet: r.moneyNet,
        }))
      : data.recentScores.slice(0, 2).map((s) => ({
          id: s.roundId,
          courseName: s.courseName,
          date: s.date,
          score: s.score,
          moneyNet: s.moneyNet,
        }));

  return (
    <div
      className="min-h-screen bg-[#18181B] pb-32"
      style={{ fontFamily: "'Helvetica Neue', Arial, sans-serif" }}
    >
      {/* ── TOP BAR ── */}
      <div className="flex items-center justify-between px-6 py-4">
        <span className="font-black text-xl uppercase tracking-tighter text-[#F3EDE4]">
          NASSAU
        </span>
        <div className="flex items-center gap-3">
          <Link href="/settlements" className="relative text-cream/40 hover:text-cream/60 transition-colors cursor-pointer">
            <Bell className="h-5 w-5" />
            {hasSettlements && (
              <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-coral" />
            )}
          </Link>
          <Link href="/profile" className="h-8 w-8 rounded-full bg-gradient-to-br from-coral to-gold flex items-center justify-center text-[11px] font-medium text-dark transition-colors cursor-pointer">
            {data.user.fullName
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)}
          </Link>
        </div>
      </div>

      {/* ── GREETING ── */}
      <div className="px-6 mt-4">
        <h1 className="font-black text-2xl text-[#F3EDE4]">
          Hey, {data.user.firstName} 👋
        </h1>
        <p className="text-sm text-[#71717A]">{formatCurrentDate()}</p>
      </div>

      {/* ── SETTLEMENTS BANNER ── */}
      {hasSettlements && firstOwing && (
        <div className="mx-6 mt-4 rounded-xl bg-[#27272A] p-4 border-l-4 border-[#D94F2B]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-[#D94F2B] shrink-0" />
              <div>
                <p className="font-bold text-[#F3EDE4] text-sm">
                  You owe {firstOwing.toUser} ${firstOwing.amount.toFixed(0)}
                </p>
                {firstOwing.roundNote && (
                  <p className="text-xs text-[#71717A]">
                    From {firstOwing.roundNote}
                  </p>
                )}
              </div>
            </div>
            <Link href="/settlements" className="text-[#D94F2B] font-bold text-sm">
              Settle Up →
            </Link>
          </div>
        </div>
      )}

      {/* ── QUICK STATS ROW ── */}
      <div className="mx-6 mt-4 rounded-xl bg-[#27272A] p-4">
        <div className="grid grid-cols-3 divide-x divide-[#3F3F46]">
          <div className="text-center">
            <p className="font-black text-xl text-[#F3EDE4]">{totalRounds}</p>
            <p className="text-xs uppercase text-[#71717A] tracking-wide">Rounds</p>
          </div>
          <div className="text-center">
            <p className="font-black text-xl text-[#F3EDE4]">{avgScore}</p>
            <p className="text-xs uppercase text-[#71717A] tracking-wide">Avg Score</p>
          </div>
          <div className="text-center">
            <p className="font-black text-xl text-[#D94F2B]">${totalWon}</p>
            <p className="text-xs uppercase text-[#71717A] tracking-wide">Won</p>
          </div>
        </div>
      </div>

      {/* ── PRIMARY CTA ── */}
      <Link
        href="/rounds/new"
        className="mx-6 mt-4 flex items-center justify-between rounded-xl bg-[#D94F2B] p-5 cursor-pointer hover:opacity-90"
      >
        <div>
          <p className="font-black text-xl uppercase text-white leading-none">
            START A ROUND
          </p>
          <p className="text-sm text-white/70 mt-1">10 seconds to tee off</p>
        </div>
        <Flag className="h-8 w-8 text-white" />
      </Link>

      {/* ── UPCOMING SECTION ── */}
      <div className="px-6 mt-6">
        <p className="text-xs font-black uppercase tracking-widest text-[#0D7377] mb-3">
          UPCOMING
        </p>
        {upcomingRound ? (
          <Link
            href={`/rounds/${upcomingRound.id}`}
            className="block rounded-xl bg-[#27272A] p-4 border border-[#0D7377]/30"
          >
            <p className="font-bold text-[#F3EDE4]">{upcomingRound.courseName}</p>
            {upcomingRound.courseLocation && (
              <span className="text-[#F3EDE4]"> — {upcomingRound.courseLocation}</span>
            )}
            <p className="text-sm text-[#71717A]">
              {formatTeeTime(upcomingRound.teeTime)}
            </p>
            <div className="flex items-center justify-between mt-3">
              <div className="flex -space-x-2">
                {upcomingRound.players.slice(0, 4).map((p) => (
                  <div
                    key={p.id}
                    className="h-7 w-7 rounded-full bg-[#3F3F46] border-2 border-[#27272A] flex items-center justify-center text-[10px] font-bold text-[#F3EDE4]"
                  >
                    {p.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)}
                  </div>
                ))}
              </div>
              <span className="text-[#0D7377] font-bold text-sm ml-auto">
                View Round →
              </span>
            </div>
          </Link>
        ) : (
          <div className="rounded-xl bg-[#27272A] p-4 border border-[#0D7377]/30">
            <p className="text-sm text-[#71717A]">
              No upcoming rounds ·{" "}
              <Link href="/rounds/new" className="text-[#0D7377] font-bold">
                Start one now →
              </Link>
            </p>
          </div>
        )}
      </div>

      {/* ── RECENT ROUNDS SECTION ── */}
      <div className="px-6 mt-6">
        <p className="text-xs font-black uppercase tracking-widest text-[#71717A] mb-3">
          RECENT ROUNDS
        </p>
        {recentRoundsList.length > 0 ? (
          <div className="divide-y divide-[#3F3F46]">
            {recentRoundsList.map((round) => (
              <Link
                key={round.id}
                href={`/rounds/${round.id}`}
                className="flex items-center justify-between py-3"
              >
                <div>
                  <p className="font-bold text-[#F3EDE4]">{round.courseName}</p>
                  <p className="text-xs text-[#71717A]">{formatShortDate(round.date)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[#71717A]">{round.score}</span>
                  {round.moneyNet > 0 && (
                    <span className="text-[#D94F2B] font-bold text-sm">
                      You won ${round.moneyNet.toFixed(0)}
                    </span>
                  )}
                  <ChevronRight className="h-4 w-4 text-[#71717A]" />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[#71717A]">
            No rounds yet · Your history will appear here
          </p>
        )}
      </div>

      {/* ── YOUR TRIPS SECTION ── */}
      <div className="px-6 mt-6">
        <p className="text-xs font-black uppercase tracking-widest text-[#71717A] mb-3">
          YOUR TRIPS
        </p>
        <div className="rounded-xl bg-[#27272A] p-4">
          <p className="font-bold text-[#F3EDE4]">Scottsdale Invitational</p>
          <p className="text-sm text-[#71717A]">Apr 10–13 · 6 golfers</p>
          <div className="h-1.5 bg-[#3F3F46] rounded-full mt-3">
            <div className="h-1.5 bg-[#0D7377] rounded-full w-2/3" />
          </div>
          <p className="text-xs text-[#0D7377] mt-1">4 of 6 paid</p>
        </div>
      </div>

      {/* ── SETTLEMENTS SECTION ── */}
      <div className="px-6 mt-6 mb-24">
        <p className="text-xs font-black uppercase tracking-widest text-[#71717A] mb-3">
          SETTLEMENTS
        </p>
        <Link
          href="/settlements"
          className="flex items-center justify-between bg-[#27272A] rounded-xl p-4 border border-[#3F3F46] cursor-pointer hover:border-[#D94F2B] transition-colors"
        >
          <div className="flex items-center">
            <DollarSign className="text-[#0D7377] w-5 h-5" />
            <span className="font-bold text-[#F3EDE4] text-sm ml-3">
              View Settlements
            </span>
            {hasSettlements && (
              <span className="w-2 h-2 bg-[#D94F2B] rounded-full ml-2" />
            )}
          </div>
          <ChevronRight className="text-[#71717A] w-4 h-4" />
        </Link>
      </div>

      {/* ── BOTTOM NAV ── */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#18181B] border-t border-[#27272A] px-6 py-3">
        <div className="grid grid-cols-4">
          <Link href="/dashboard" className="flex flex-col items-center gap-1">
            <Home className="h-5 w-5 text-[#D94F2B]" />
            <span className="text-xs uppercase font-bold text-[#D94F2B]">Home</span>
          </Link>
          <Link href="/rounds" className="flex flex-col items-center gap-1">
            <Trophy className="h-5 w-5 text-[#71717A]" />
            <span className="text-xs uppercase font-bold text-[#71717A]">Rounds</span>
          </Link>
          <Link href="/trips" className="flex flex-col items-center gap-1">
            <Map className="h-5 w-5 text-[#71717A]" />
            <span className="text-xs uppercase font-bold text-[#71717A]">Trips</span>
          </Link>
          <Link href="/profile" className="flex flex-col items-center gap-1">
            <User className="h-5 w-5 text-[#71717A]" />
            <span className="text-xs uppercase font-bold text-[#71717A]">Profile</span>
          </Link>
        </div>
      </nav>

      {/* ── FLOATING BUTTON ── */}
      <Link
        href="/rounds/new"
        className="fixed bottom-20 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-[#D94F2B] shadow-lg shadow-[#D94F2B]/30"
      >
        <Flag className="h-6 w-6 text-white" />
      </Link>
    </div>
  );
}
