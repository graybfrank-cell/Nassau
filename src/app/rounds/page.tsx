"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { getGameRounds } from "@/lib/game-store";
import { GameRound } from "@/lib/types";
import { Plus, MapPin, Users, Calendar, Trophy, DollarSign } from "lucide-react";

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

function formatDateTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }) + " · " + d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function StatusBadge({ status }: { status: string }) {
  if (status === "upcoming") {
    return (
      <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
        Upcoming
      </span>
    );
  }
  if (status === "in_progress") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
        Live
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-500">
      Completed
    </span>
  );
}

export default function RoundsPage() {
  const router = useRouter();
  const [rounds, setRounds] = useState<GameRound[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        router.push("/login");
        return;
      }
      setRounds(await getGameRounds());
      setLoading(false);
    });
  }, [router]);

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center">
        <p className="text-sm text-zinc-400">Loading...</p>
      </div>
    );
  }

  const upcoming = rounds
    .filter((r) => {
      const es = effectiveStatus(r);
      return es === "upcoming" || es === "in_progress";
    })
    .sort((a, b) => new Date(a.teeTime).getTime() - new Date(b.teeTime).getTime());

  const past = rounds
    .filter((r) => effectiveStatus(r) === "completed")
    .sort((a, b) => new Date(b.teeTime).getTime() - new Date(a.teeTime).getTime());

  return (
    <div className="min-h-[calc(100vh-64px)] bg-zinc-50 px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
              My Rounds
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              Track your regular games.
            </p>
          </div>
          <Link
            href="/rounds/new"
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4" />
            New Round
          </Link>
        </div>

        {rounds.length === 0 ? (
          <div className="mt-16 text-center">
            <div className="text-4xl">⛳</div>
            <h2 className="mt-4 text-lg font-semibold text-zinc-900">
              No rounds yet
            </h2>
            <p className="mt-2 text-sm text-zinc-500">
              Start tracking your regular games.
              <br />
              Scores, skins, expenses — all in one place.
            </p>
            <Link
              href="/rounds/new"
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
            >
              <Plus className="h-4 w-4" />
              Create Your First Round
            </Link>
          </div>
        ) : (
          <>
            {/* Upcoming Rounds */}
            {upcoming.length > 0 && (
              <div className="mt-8">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Upcoming
                </h2>
                <div className="mt-3 space-y-3">
                  {upcoming.map((round) => (
                    <RoundCard key={round.id} round={round} />
                  ))}
                </div>
              </div>
            )}

            {/* Past Rounds */}
            {past.length > 0 && (
              <div className="mt-8">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Past Rounds
                </h2>
                <div className="mt-3 space-y-3">
                  {past.map((round) => (
                    <RoundCard key={round.id} round={round} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function RoundCard({ round }: { round: GameRound }) {
  const displayStatus = effectiveStatus(round);
  const confirmedCount = round.players.filter(
    (p) => p.status === "confirmed" || p.role === "COMMISSIONER"
  ).length;

  const settledCount = round.settlements.filter((s) => s.settled).length;
  const totalSettlements = round.settlements.length;

  // Find best score
  const scores = round.scorecards
    .filter((sc) => sc.total && sc.total > 0)
    .sort((a, b) => (a.total || 999) - (b.total || 999));

  const bestPlayer = scores.length > 0
    ? round.players.find((p) => p.id === scores[0].playerId)
    : null;

  return (
    <Link
      href={`/rounds/${round.id}`}
      className="block rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-zinc-900">
              {round.courseName}
              {round.courseLayout && (
                <span className="ml-1.5 text-sm font-normal text-zinc-500">
                  ({round.courseLayout})
                </span>
              )}
            </h3>
            <StatusBadge status={displayStatus} />
          </div>

          {round.courseLocation && (
            <div className="mt-1 flex items-center gap-1.5 text-sm text-zinc-500">
              <MapPin className="h-3.5 w-3.5" />
              {round.courseLocation}
            </div>
          )}

          <div className="mt-1.5 flex items-center gap-1.5 text-sm text-zinc-500">
            <Calendar className="h-3.5 w-3.5" />
            {formatDateTime(round.teeTime)}
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-zinc-400">
            <span className="inline-flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {confirmedCount} player{confirmedCount !== 1 ? "s" : ""}
            </span>

            {round.skinsGame && (
              <span className="inline-flex items-center gap-1">
                <Trophy className="h-3.5 w-3.5" />
                ${round.skinsGame.buyIn} skins
              </span>
            )}

            {displayStatus === "completed" && bestPlayer && scores[0].total && (
              <span className="inline-flex items-center gap-1 text-emerald-600">
                <Trophy className="h-3.5 w-3.5" />
                {bestPlayer.name} shot {scores[0].total}
              </span>
            )}

            {displayStatus === "completed" && scores.length > 0 && (
              <span className="text-zinc-400">
                Scores: {scores.map((sc) => sc.total).join(", ")}
              </span>
            )}

            {totalSettlements > 0 && (
              <span className="inline-flex items-center gap-1">
                <DollarSign className="h-3.5 w-3.5" />
                {settledCount === totalSettlements ? (
                  <span className="text-emerald-600">All settled</span>
                ) : (
                  `${totalSettlements - settledCount} unsettled`
                )}
              </span>
            )}
          </div>
        </div>

        <span className="text-sm text-zinc-400">View &rarr;</span>
      </div>
    </Link>
  );
}
