"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";
import {
  Flag,
  Home,
  Trophy,
  Map,
  User,
  AlertCircle,
  ChevronRight,
  DollarSign,
} from "lucide-react";
import TopBar from "@/components/TopBar";
import type { DashboardData } from "@/types/dashboard";
import knowledgeBase from "@/data/nassau-knowledge-base.json";

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
      className={`animate-pulse rounded-xl bg-[#1A1A1A] ${className ?? ""}`}
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
      <div className="min-h-screen bg-[#111111]">
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

  // First-time user empty state: no trips, no rounds, no scores
  const isEmpty =
    totalRounds === 0 &&
    (data.upcomingRounds?.length ?? 0) === 0 &&
    data.recentRounds.length === 0 &&
    data.recentScores.length === 0 &&
    !hasSettlements;

  if (isEmpty) {
    return <EmptyDashboard firstName={data.user.firstName} />;
  }

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
    <div className="min-h-screen bg-[#111111] pb-32">
      {/* ── BANNER ── */}
      <div className="relative h-40 sm:h-48 overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?q=80&w=2070&auto=format&fit=crop"
          alt="Sunrise over a golf course"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#111111]/80 via-[#111111]/60 to-[#111111]" />
        <div className="relative z-10 flex flex-col h-full">
          {/* ── TOP BAR ── */}
          <TopBar />
          {/* ── GREETING ── */}
          <div className="mt-auto px-6 pb-5">
            <h1 className="font-headline text-[24px] font-medium text-[#F2F0EB]">
              Hey, {data.user.firstName}
            </h1>
            <p className="text-sm text-[#5C5C5C]">{formatCurrentDate()}</p>
          </div>
        </div>
      </div>

      {/* ── SETTLEMENTS BANNER ── */}
      {hasSettlements && firstOwing && (
        <div className="mx-6 mt-4 rounded-[10px] bg-[#1A1A1A] p-4 border-l-4 border-[#C4423B] shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-[#C4423B] shrink-0" />
              <div>
                <p className="font-semibold text-[#F2F0EB] text-sm">
                  You owe {firstOwing.toUser} ${firstOwing.amount.toFixed(0)}
                </p>
                {firstOwing.roundNote && (
                  <p className="text-xs text-[#5C5C5C]">
                    From {firstOwing.roundNote}
                  </p>
                )}
              </div>
            </div>
            <Link href="/settlements" className="text-[#C4423B] font-semibold text-sm">
              Settle Up →
            </Link>
          </div>
        </div>
      )}

      {/* ── QUICK STATS ROW ── */}
      <div className="mx-6 mt-4 rounded-[10px] bg-[#1A1A1A] p-4 shadow-sm">
        <div className="grid grid-cols-3 divide-x divide-[#2A2A2A]">
          <div className="text-center">
            <p className="font-semibold text-[20px] text-[#F2F0EB]">{totalRounds}</p>
            <p className="font-sans text-[11px] font-medium uppercase tracking-[0.08em] text-[#5C5C5C]">Rounds</p>
          </div>
          <div className="text-center">
            <p className="font-semibold text-[20px] text-[#F2F0EB]">{avgScore}</p>
            <p className="font-sans text-[11px] font-medium uppercase tracking-[0.08em] text-[#5C5C5C]">Avg Score</p>
          </div>
          <div className="text-center">
            <p className="font-semibold text-[20px] text-[#2D5A3D]">${totalWon}</p>
            <p className="font-sans text-[11px] font-medium uppercase tracking-[0.08em] text-[#5C5C5C]">Won</p>
          </div>
        </div>
      </div>

      {/* ── PRIMARY CTA ── */}
      <Link
        href="/rounds/new"
        className="mx-6 mt-4 flex items-center justify-between rounded-[10px] bg-[#2D5A3D] p-5 cursor-pointer hover:opacity-90"
      >
        <div>
          <p className="font-headline text-[20px] font-medium text-white leading-none">
            Start a Round
          </p>
          <p className="text-sm text-white/70 mt-1">10 seconds to tee off</p>
        </div>
        <Flag className="h-8 w-8 text-white" />
      </Link>

      {/* ── UPCOMING SECTION ── */}
      <div className="px-6 mt-6">
        <p className="font-sans text-[11px] font-medium uppercase tracking-[0.08em] text-[#5C5C5C] mb-3">
          UPCOMING
        </p>
        {upcomingRound ? (
          <Link
            href={`/rounds/${upcomingRound.id}`}
            className="block rounded-[10px] bg-[#1A1A1A] p-4 shadow-sm"
          >
            <p className="font-semibold text-[#F2F0EB]">{upcomingRound.courseName}</p>
            {upcomingRound.courseLocation && (
              <span className="text-[#F2F0EB]"> — {upcomingRound.courseLocation}</span>
            )}
            <p className="text-sm text-[#8A8A8A]">
              {formatTeeTime(upcomingRound.teeTime)}
            </p>
            <div className="flex items-center justify-between mt-3">
              <div className="flex -space-x-2">
                {upcomingRound.players.slice(0, 4).map((p) => (
                  <div
                    key={p.id}
                    className="h-7 w-7 rounded-full bg-[#2F4F4F] border-2 border-[#1A1A1A] flex items-center justify-center text-[10px] font-medium text-[#F2F0EB]"
                  >
                    {p.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)}
                  </div>
                ))}
              </div>
              <span className="text-[#2D5A3D] font-semibold text-sm ml-auto">
                View Round →
              </span>
            </div>
          </Link>
        ) : (
          <div className="rounded-[10px] bg-[#1A1A1A] p-4 shadow-sm">
            <p className="text-sm text-[#8A8A8A]">
              No upcoming rounds ·{" "}
              <Link href="/rounds/new" className="text-[#2D5A3D] font-semibold">
                Start one now →
              </Link>
            </p>
          </div>
        )}
      </div>

      {/* ── RECENT ROUNDS SECTION ── */}
      <div className="px-6 mt-6">
        <p className="font-sans text-[11px] font-medium uppercase tracking-[0.08em] text-[#5C5C5C] mb-3">
          RECENT ROUNDS
        </p>
        {recentRoundsList.length > 0 ? (
          <div className="divide-y divide-[#2A2A2A]">
            {recentRoundsList.map((round) => (
              <Link
                key={round.id}
                href={`/rounds/${round.id}`}
                className="flex items-center justify-between py-3"
              >
                <div>
                  <p className="font-semibold text-[#F2F0EB]">{round.courseName}</p>
                  <p className="text-xs text-[#8A8A8A]">{formatShortDate(round.date)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[#8A8A8A]">{round.score}</span>
                  {round.moneyNet > 0 && (
                    <span className="text-[#2D5A3D] font-semibold text-sm">
                      You won ${round.moneyNet.toFixed(0)}
                    </span>
                  )}
                  <ChevronRight className="h-4 w-4 text-[#8A8A8A]" />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[#8A8A8A]">
            No rounds yet · Your history will appear here
          </p>
        )}
      </div>

      {/* ── YOUR TRIPS SECTION ── */}
      <div className="px-6 mt-6">
        <p className="font-sans text-[11px] font-medium uppercase tracking-[0.08em] text-[#5C5C5C] mb-3">
          YOUR TRIPS
        </p>
        <div className="rounded-[10px] bg-[#1A1A1A] p-4 shadow-sm">
          <p className="font-semibold text-[#F2F0EB]">Scottsdale Invitational</p>
          <p className="text-sm text-[#8A8A8A]">Apr 10–13 · 6 golfers</p>
          <div className="h-1.5 bg-[#2A2A2A] rounded-full mt-3">
            <div className="h-1.5 bg-[#2D5A3D] rounded-full w-2/3" />
          </div>
          <p className="text-xs text-[#2D5A3D] mt-1">4 of 6 paid</p>
        </div>
      </div>

      {/* ── SETTLEMENTS SECTION ── */}
      <div className="px-6 mt-6 mb-24">
        <p className="font-sans text-[11px] font-medium uppercase tracking-[0.08em] text-[#5C5C5C] mb-3">
          SETTLEMENTS
        </p>
        <Link
          href="/settlements"
          className="flex items-center justify-between bg-[#1A1A1A] rounded-[10px] p-4 shadow-sm cursor-pointer hover:bg-[#1E1E1E] transition-colors"
        >
          <div className="flex items-center">
            <DollarSign className="text-[#2D5A3D] w-5 h-5" />
            <span className="font-semibold text-[#F2F0EB] text-sm ml-3">
              View Settlements
            </span>
            {hasSettlements && (
              <span className="w-2 h-2 bg-[#C4423B] rounded-full ml-2" />
            )}
          </div>
          <ChevronRight className="text-[#8A8A8A] w-4 h-4" />
        </Link>
      </div>

      {/* ── BOTTOM NAV ── */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#111111] border-t border-[#1A1A1A] px-6 py-3">
        <div className="grid grid-cols-4">
          <Link href="/dashboard" className="flex flex-col items-center gap-1">
            <Home className="h-5 w-5 text-[#2D5A3D]" />
            <span className="text-xs uppercase font-medium text-[#2D5A3D]">Home</span>
          </Link>
          <Link href="/rounds" className="flex flex-col items-center gap-1">
            <Trophy className="h-5 w-5 text-[#8A8A8A]" />
            <span className="text-xs uppercase font-medium text-[#8A8A8A]">Rounds</span>
          </Link>
          <Link href="/trips" className="flex flex-col items-center gap-1">
            <Map className="h-5 w-5 text-[#8A8A8A]" />
            <span className="text-xs uppercase font-medium text-[#8A8A8A]">Trips</span>
          </Link>
          <Link href="/profile" className="flex flex-col items-center gap-1">
            <User className="h-5 w-5 text-[#8A8A8A]" />
            <span className="text-xs uppercase font-medium text-[#8A8A8A]">Profile</span>
          </Link>
        </div>
      </nav>

      {/* ── FLOATING BUTTON ── */}
      <Link
        href="/rounds/new"
        className="fixed bottom-20 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-[#2D5A3D] shadow-lg shadow-[#2D5A3D]/30"
      >
        <Flag className="h-6 w-6 text-white" />
      </Link>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Empty Dashboard (first-time user)
// ---------------------------------------------------------------------------
const FEATURED_EMPTY_DESTINATIONS = [
  "scottsdale-az",
  "pinehurst-nc",
  "pebble-beach-monterey-ca",
  "bandon-dunes-or",
];

interface KBDestinationLite {
  id: string;
  destination: string;
  region: string;
  why_go?: string;
}

function EmptyDashboard({ firstName }: { firstName: string }) {
  const kb = knowledgeBase as { destinations?: KBDestinationLite[] };
  const featured = (kb.destinations ?? []).filter((d) =>
    FEATURED_EMPTY_DESTINATIONS.includes(d.id)
  );

  return (
    <div className="min-h-screen bg-[#111111] pb-32">
      {/* Hero */}
      <div className="relative h-44 sm:h-52 overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?q=80&w=2070&auto=format&fit=crop"
          alt="Sunrise over a golf course"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#111111]/70 via-[#111111]/60 to-[#111111]" />
        <div className="relative z-10 flex h-full flex-col">
          <TopBar />
          <div className="mt-auto px-6 pb-5">
            <h1 className="font-headline text-[26px] font-medium text-[#F2F0EB]">
              Welcome to Nassau, {firstName}
            </h1>
            <p className="mt-1 text-sm text-[#B5B5B5]">
              Run the trip. Plan it. Play it. Settle it.
            </p>
          </div>
        </div>
      </div>

      {/* Two action cards */}
      <div className="mx-6 mt-5 grid gap-3 sm:grid-cols-2">
        <Link
          href="/trips/create"
          className="group flex min-h-[120px] flex-col justify-between rounded-2xl bg-[#2D5A3D] p-5 transition-opacity hover:opacity-90"
        >
          <Map className="h-6 w-6 text-white" />
          <div>
            <p className="font-headline text-[20px] font-medium leading-tight text-white">
              Plan a golf trip
            </p>
            <p className="mt-1 text-xs text-white/80">
              Destination, dates, crew — all in one link.
            </p>
          </div>
        </Link>
        <Link
          href="/rounds/new"
          className="group flex min-h-[120px] flex-col justify-between rounded-2xl border border-[#2D5A3D]/50 bg-[#1A1A1A] p-5 transition-colors hover:border-[#2D5A3D]"
        >
          <Flag className="h-6 w-6 text-[#2D5A3D]" />
          <div>
            <p className="font-headline text-[20px] font-medium leading-tight text-[#F2F0EB]">
              Start a round
            </p>
            <p className="mt-1 text-xs text-[#8A8A8A]">
              Score, bets, settlements — free forever.
            </p>
          </div>
        </Link>
      </div>

      {/* Featured destinations */}
      {featured.length > 0 && (
        <div className="mt-8 px-6">
          <div className="mb-3 flex items-end justify-between">
            <p className="font-sans text-[11px] font-medium uppercase tracking-[0.08em] text-[#5C5C5C]">
              Popular destinations
            </p>
            <Link
              href="/explore"
              className="text-xs font-semibold text-[#2D5A3D]"
            >
              See all →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {featured.map((dest) => (
              <Link
                key={dest.id}
                href={`/trips/create?destination=${dest.id}`}
                className="rounded-2xl bg-[#1A1A1A] p-4 transition-colors hover:bg-[#202020]"
              >
                <p className="font-semibold text-[#F2F0EB] text-sm">
                  {dest.destination}
                </p>
                <p className="mt-1 text-xs text-[#8A8A8A]">{dest.region}</p>
                {dest.why_go && (
                  <p className="mt-2 line-clamp-2 text-xs text-[#B5B5B5]">
                    {dest.why_go}
                  </p>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* How it works */}
      <div className="mt-10 px-6">
        <p className="mb-4 font-sans text-[11px] font-medium uppercase tracking-[0.08em] text-[#5C5C5C]">
          How it works
        </p>
        <ol className="space-y-3">
          {[
            { n: 1, title: "Pick a destination", body: "Or invite the crew first — start the trip from anywhere." },
            { n: 2, title: "Invite the crew", body: "Share one link. Everyone RSVPs, pays, and plays." },
            { n: 3, title: "Play & settle", body: "Score in real time. Settle up over Venmo at the 19th." },
          ].map((step) => (
            <li
              key={step.n}
              className="flex items-start gap-3 rounded-2xl bg-[#1A1A1A] p-4"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#2D5A3D] text-xs font-bold text-white">
                {step.n}
              </span>
              <div>
                <p className="text-sm font-semibold text-[#F2F0EB]">
                  {step.title}
                </p>
                <p className="mt-0.5 text-xs text-[#8A8A8A]">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 border-t border-[#1A1A1A] bg-[#111111] px-6 py-3">
        <div className="grid grid-cols-4">
          <Link href="/dashboard" className="flex flex-col items-center gap-1">
            <Home className="h-5 w-5 text-[#2D5A3D]" />
            <span className="text-xs font-medium uppercase text-[#2D5A3D]">
              Home
            </span>
          </Link>
          <Link href="/rounds" className="flex flex-col items-center gap-1">
            <Trophy className="h-5 w-5 text-[#8A8A8A]" />
            <span className="text-xs font-medium uppercase text-[#8A8A8A]">
              Rounds
            </span>
          </Link>
          <Link href="/trips" className="flex flex-col items-center gap-1">
            <Map className="h-5 w-5 text-[#8A8A8A]" />
            <span className="text-xs font-medium uppercase text-[#8A8A8A]">
              Trips
            </span>
          </Link>
          <Link href="/profile" className="flex flex-col items-center gap-1">
            <User className="h-5 w-5 text-[#8A8A8A]" />
            <span className="text-xs font-medium uppercase text-[#8A8A8A]">
              Profile
            </span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
