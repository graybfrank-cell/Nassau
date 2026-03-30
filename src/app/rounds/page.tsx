"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { getGameRounds } from "@/lib/game-store";
import { GameRound } from "@/lib/types";
import {
  Plus,
  Home,
  Trophy,
  Map,
  User,
} from "lucide-react";
import TopBar from "@/components/TopBar";

const FOUR_HOURS_MS = 4 * 60 * 60 * 1000;

/** True if the round's tee time is more than 4 hours in the past. */
function isRoundPastDue(round: GameRound): boolean {
  return new Date(round.teeTime).getTime() < Date.now() - FOUR_HOURS_MS;
}

/** Returns the effective status, treating past-due active/in_progress rounds as completed. */
function effectiveStatus(round: GameRound): string {
  if (
    (round.status === "upcoming" || round.status === "in_progress") &&
    isRoundPastDue(round)
  ) {
    return "completed";
  }
  return round.status;
}

type FilterKey = "all" | "with_bets" | "wins_only" | "this_year";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "with_bets", label: "With Bets" },
  { key: "wins_only", label: "Wins Only" },
  { key: "this_year", label: "This Year" },
];

function computeMoneyWon(round: GameRound, userId: string | undefined): number {
  if (!userId) return 0;
  let won = 0;
  for (const s of round.settlements || []) {
    if (s.toPlayerId === userId || s.toUserId === userId) won += s.amount || 0;
  }
  return won;
}

function computeMoneyLost(round: GameRound, userId: string | undefined): number {
  if (!userId) return 0;
  let lost = 0;
  for (const s of round.settlements || []) {
    if (s.fromPlayerId === userId || s.fromUserId === userId) lost += s.amount || 0;
  }
  return lost;
}

function getBestScore(round: GameRound, userId: string | undefined): number | null {
  if (!userId) return null;
  const player = (round.players || []).find(
    (p: any) => p.userId === userId
  );
  if (!player) return null;
  const sc = (round.scorecards || []).find(
    (s: any) => s.playerId === player.id
  );
  return sc?.total ?? null;
}

function getCoursePar(round: GameRound): number | null {
  const sc = (round.scorecards || [])[0];
  if (!sc?.pars) return null;
  return (sc.pars as number[]).reduce((a: number, b: number) => a + b, 0);
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function RoundsPage() {
  const router = useRouter();
  const [rounds, setRounds] = useState<GameRound[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string>();
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push("/login?redirect=/rounds"); return; }
      setUserId(user.id);
      // Check subscription status
      try {
        const profileRes = await fetch("/api/profile");
        if (profileRes.ok) {
          const profile = await profileRes.json();
          const status = profile.subscription_status;
          if (status !== "active" && status !== "trialing") {
            router.push("/pricing");
            return;
          }
        }
      } catch {
        // Non-critical — allow access on error
      }
      setRounds(await getGameRounds());
      setLoading(false);
    });
  }, [router]);

  const completedRounds = useMemo(
    () => rounds.filter((r) => effectiveStatus(r) === "completed"),
    [rounds]
  );

  const totalWon = useMemo(
    () => completedRounds.reduce((sum, r) => sum + computeMoneyWon(r, userId), 0),
    [completedRounds, userId]
  );

  const totalLost = useMemo(
    () => completedRounds.reduce((sum, r) => sum + computeMoneyLost(r, userId), 0),
    [completedRounds, userId]
  );

  const netWon = totalWon - totalLost;

  const avgScore = useMemo(() => {
    const scores = completedRounds
      .map((r) => getBestScore(r, userId))
      .filter((s): s is number => s !== null);
    if (scores.length === 0) return null;
    const pars = completedRounds
      .map((r) => getCoursePar(r))
      .filter((p): p is number => p !== null);
    if (pars.length === 0) return null;
    const avgPar = pars.reduce((a, b) => a + b, 0) / pars.length;
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    return avg - avgPar;
  }, [completedRounds, userId]);

  const filteredRounds = useMemo(() => {
    let filtered = [...rounds];
    if (activeFilter === "with_bets") {
      filtered = filtered.filter((r) => r.skinsGame || r.nassauBet);
    } else if (activeFilter === "wins_only") {
      filtered = filtered.filter((r) => computeMoneyWon(r, userId) > computeMoneyLost(r, userId));
    } else if (activeFilter === "this_year") {
      const year = new Date().getFullYear();
      filtered = filtered.filter((r) => new Date(r.teeTime).getFullYear() === year);
    }
    return filtered.sort(
      (a, b) => new Date(b.teeTime).getTime() - new Date(a.teeTime).getTime()
    );
  }, [rounds, activeFilter, userId]);

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center bg-[#18181B]">
      <p className="text-sm text-[#71717A]" style={{ fontFamily: "'Helvetica Neue', Arial, sans-serif" }}>Loading...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#18181B] pb-32" style={{ fontFamily: "'Helvetica Neue', Arial, sans-serif" }}>
      {/* ── BANNER ── */}
      <div className="relative h-40 sm:h-48 overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1593282153762-a41e3cceb06c?q=80&w=987&auto=format&fit=crop"
          alt="Close-up golf moment"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-dark/80 via-dark/60 to-dark" />
        <div className="relative z-10 flex flex-col h-full">
          <TopBar />
          <div className="mt-auto px-6 pb-5">
            <h1 className="text-[22px] font-medium text-[#F3EDE4] tracking-tight">My Rounds</h1>
            <p className="text-[13px] text-[#F3EDE4]/50">
              {completedRounds.length} rounds played
            </p>
          </div>
        </div>
      </div>

      {/* ── STATS ROW ── */}
      <div className="mx-6 mt-4 bg-[#27272A] rounded-xl p-4">
        <div className="grid grid-cols-3 divide-x divide-[#3F3F46]">
          <div className="text-center">
            <div className="text-2xl font-black text-[#F3EDE4]">{completedRounds.length}</div>
            <div className="text-xs uppercase text-[#71717A] font-bold mt-1">Rounds</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-black text-[#F3EDE4]">
              {avgScore !== null ? (avgScore >= 0 ? `+${avgScore.toFixed(1)}` : avgScore.toFixed(1)) : "—"}
            </div>
            <div className="text-xs uppercase text-[#71717A] font-bold mt-1">Avg Score</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-black text-[#D94F2B]">${Math.abs(netWon).toLocaleString()}</div>
            <div className="text-xs uppercase text-[#71717A] font-bold mt-1">Won</div>
          </div>
        </div>
      </div>

      {/* ── FILTER PILLS ── */}
      <div className="px-6 mt-4 flex gap-2 overflow-x-auto">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setActiveFilter(f.key)}
            className={`text-xs font-black uppercase px-4 py-2 rounded-full whitespace-nowrap ${
              activeFilter === f.key
                ? "bg-[#D94F2B] text-white"
                : "border border-[#3F3F46] text-[#71717A]"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* ── ROUNDS LIST ── */}
      <div className="px-6 mt-4 space-y-3">
        {filteredRounds.length === 0 && rounds.length === 0 ? (
          <div className="bg-[#27272A] rounded-xl p-8 border border-[#3F3F46] text-center">
            <p className="text-[#71717A] text-sm mb-4">No rounds yet</p>
            <Link
              href="/rounds/new"
              className="inline-flex items-center gap-2 bg-[#D94F2B] text-white font-bold text-sm px-5 py-2.5 rounded-lg"
            >
              <Plus className="h-4 w-4" />
              Start Your First Round
            </Link>
          </div>
        ) : filteredRounds.length === 0 ? (
          <div className="bg-[#27272A] rounded-xl p-8 border border-[#3F3F46] text-center">
            <p className="text-[#71717A] text-sm">No rounds match this filter.</p>
          </div>
        ) : (
          filteredRounds.map((round) => (
            <RoundCard key={round.id} round={round} userId={userId} />
          ))
        )}
      </div>

      {/* ── NEW ROUND BUTTON ── */}
      <Link
        href="/rounds/new"
        className="fixed bottom-20 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-[#D94F2B] shadow-lg shadow-[#D94F2B]/30"
      >
        <Plus className="h-6 w-6 text-white" />
      </Link>

      {/* ── BOTTOM NAV ── */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#18181B] border-t border-[#27272A] px-6 py-3">
        <div className="grid grid-cols-4">
          <Link href="/dashboard" className="flex flex-col items-center gap-1">
            <Home className="h-5 w-5 text-[#71717A]" />
            <span className="text-xs uppercase font-bold text-[#71717A]">Home</span>
          </Link>
          <Link href="/rounds" className="flex flex-col items-center gap-1">
            <Trophy className="h-5 w-5 text-[#D94F2B]" />
            <span className="text-xs uppercase font-bold text-[#D94F2B]">Rounds</span>
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
    </div>
  );
}

function RoundCard({ round, userId }: { round: GameRound; userId: string | undefined }) {
  const status = effectiveStatus(round);
  const score = getBestScore(round, userId);
  const par = getCoursePar(round);
  const won = computeMoneyWon(round, userId);
  const lost = computeMoneyLost(round, userId);
  const net = won - lost;
  const scoreDiff = score !== null && par !== null ? score - par : null;

  const players = round.players || [];

  return (
    <Link href={`/rounds/${round.id}`} className="block bg-[#27272A] rounded-xl p-4 border border-[#3F3F46]">
      {/* Top row */}
      <div className="flex items-center justify-between">
        <span className="font-bold text-[#F3EDE4]">{round.courseName}</span>
        <span className="text-sm text-[#71717A]">{formatDate(round.teeTime)}</span>
      </div>

      {/* Middle row */}
      <div className="flex items-center gap-2 mt-2">
        {score !== null && (
          <span
            className={`font-black text-lg px-3 py-1 rounded-lg ${
              scoreDiff !== null && scoreDiff < 0
                ? "bg-[#0D7377]/20 text-[#0D7377]"
                : "bg-[#3F3F46] text-[#71717A]"
            }`}
          >
            {score}
          </span>
        )}
        {status === "in_progress" && (
          <span className="bg-[#D94F2B]/20 text-[#D94F2B] font-bold text-xs px-2 py-1 rounded flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-[#D94F2B] animate-pulse" />
            Live
          </span>
        )}
        {status === "upcoming" && (
          <span className="bg-[#0D7377]/20 text-[#0D7377] font-bold text-xs px-2 py-1 rounded">
            Upcoming
          </span>
        )}
        {(won > 0 || lost > 0) && (
          <span
            className={`font-bold text-xs px-2 py-1 rounded ${
              net >= 0
                ? "bg-[#D94F2B]/20 text-[#D94F2B]"
                : "bg-red-900/20 text-red-400"
            }`}
          >
            {net >= 0 ? `Won $${net}` : `Lost $${Math.abs(net)}`}
          </span>
        )}
      </div>

      {/* Bottom row */}
      <div className="flex items-center justify-between mt-3">
        <div className="flex -space-x-2">
          {players.slice(0, 4).map((p: any, i: number) => (
            <div
              key={p.id || i}
              className="h-7 w-7 rounded-full bg-[#3F3F46] border-2 border-[#27272A] flex items-center justify-center text-[10px] font-bold text-[#F3EDE4]"
            >
              {(p.name || "?").charAt(0).toUpperCase()}
            </div>
          ))}
          {players.length > 4 && (
            <div className="h-7 w-7 rounded-full bg-[#3F3F46] border-2 border-[#27272A] flex items-center justify-center text-[10px] font-bold text-[#71717A]">
              +{players.length - 4}
            </div>
          )}
        </div>
        <span className="text-[#0D7377] font-bold text-sm">View Recap →</span>
      </div>
    </Link>
  );
}
