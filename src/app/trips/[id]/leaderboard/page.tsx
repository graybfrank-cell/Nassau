"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getTrip, getScorecards } from "@/lib/store";
import { Trip, Scorecard } from "@/lib/types";
import { ArrowLeft, Trophy, Medal } from "lucide-react";

interface LeaderboardEntry {
  name: string;
  rounds: number;
  totalGross: number;
  totalNet: number;
  totalPar: number;
  bestGross: number | null;
  bestNet: number | null;
}

function buildLeaderboard(scorecards: Scorecard[]): LeaderboardEntry[] {
  const map = new Map<string, LeaderboardEntry>();

  for (const sc of scorecards) {
    const cardPar = sc.pars.reduce((a, b) => a + b, 0);

    for (const player of sc.players) {
      const completedHoles = player.scores.filter((s) => s !== null);
      if (completedHoles.length === 0) continue;

      const gross = player.scores.reduce(
        (a: number, b) => a + (b ?? 0),
        0
      );
      const net = gross - player.handicap;

      const existing = map.get(player.name) || {
        name: player.name,
        rounds: 0,
        totalGross: 0,
        totalNet: 0,
        totalPar: 0,
        bestGross: null,
        bestNet: null,
      };

      existing.rounds += 1;
      existing.totalGross += gross;
      existing.totalNet += net;
      existing.totalPar += cardPar;
      existing.bestGross =
        existing.bestGross === null
          ? gross
          : Math.min(existing.bestGross, gross);
      existing.bestNet =
        existing.bestNet === null ? net : Math.min(existing.bestNet, net);

      map.set(player.name, existing);
    }
  }

  return Array.from(map.values()).sort(
    (a, b) => a.totalGross - a.totalPar - (b.totalGross - b.totalPar)
  );
}

function formatVsPar(strokes: number, par: number): string {
  const diff = strokes - par;
  if (diff > 0) return `+${diff}`;
  if (diff === 0) return "E";
  return `${diff}`;
}

export default function LeaderboardPage() {
  const params = useParams();
  const tripId = params.id as string;

  const [trip, setTrip] = useState<Trip | null>(null);
  const [scorecards, setScorecards] = useState<Scorecard[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"gross" | "net">("gross");

  useEffect(() => {
    async function load() {
      const t = await getTrip(tripId);
      if (t) {
        setTrip(t);
        setScorecards(await getScorecards({ tripId }));
      }
      setLoading(false);
    }
    load();
  }, [tripId]);

  if (loading || !trip) {
    return (
      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center">
        <p className="text-sm text-zinc-400">Loading...</p>
      </div>
    );
  }

  const entries = buildLeaderboard(scorecards);
  const sorted =
    sortBy === "net"
      ? [...entries].sort(
          (a, b) => a.totalNet - a.totalPar - (b.totalNet - b.totalPar)
        )
      : entries;

  return (
    <div className="min-h-[calc(100vh-64px)] bg-zinc-50 px-6 py-10">
      <div className="mx-auto max-w-4xl">
        <Link
          href={`/trips/${tripId}`}
          className="inline-flex items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-zinc-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to {trip.name}
        </Link>

        <div className="mt-6">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
            Leaderboard
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Standings across {scorecards.length} round
            {scorecards.length !== 1 ? "s" : ""} during {trip.name}.
          </p>
        </div>

        {entries.length === 0 ? (
          <div className="mt-16 text-center">
            <Trophy className="mx-auto h-12 w-12 text-zinc-300" />
            <h2 className="mt-4 text-lg font-semibold text-zinc-900">
              No scores yet
            </h2>
            <p className="mt-2 text-sm text-zinc-500">
              Start a scorecard to populate the leaderboard.
            </p>
            <Link
              href={`/trips/${tripId}/scorecards`}
              className="mt-4 inline-block text-sm font-medium text-emerald-600 hover:text-emerald-700"
            >
              Go to Scorecards
            </Link>
          </div>
        ) : (
          <>
            {/* Sort toggle */}
            <div className="mt-6 flex gap-1 rounded-lg bg-zinc-100 p-1 w-fit">
              <button
                onClick={() => setSortBy("gross")}
                className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
                  sortBy === "gross"
                    ? "bg-white text-zinc-900 shadow-sm"
                    : "text-zinc-500 hover:text-zinc-700"
                }`}
              >
                Gross
              </button>
              <button
                onClick={() => setSortBy("net")}
                className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
                  sortBy === "net"
                    ? "bg-white text-zinc-900 shadow-sm"
                    : "text-zinc-500 hover:text-zinc-700"
                }`}
              >
                Net
              </button>
            </div>

            {/* Leaderboard table */}
            <div className="mt-4 overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-100 bg-zinc-50">
                    <th className="px-4 py-3 text-left font-semibold text-zinc-700">
                      Pos
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-zinc-700">
                      Player
                    </th>
                    <th className="px-4 py-3 text-center font-semibold text-zinc-700">
                      Rnds
                    </th>
                    <th className="px-4 py-3 text-center font-semibold text-zinc-700">
                      Total vs Par
                    </th>
                    <th className="px-4 py-3 text-center font-semibold text-zinc-700">
                      Avg Score
                    </th>
                    <th className="px-4 py-3 text-center font-semibold text-zinc-700">
                      Best Rd
                    </th>
                    {sortBy === "net" && (
                      <th className="px-4 py-3 text-center font-semibold text-zinc-700">
                        Net vs Par
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((entry, idx) => {
                    const grossVsPar = formatVsPar(
                      entry.totalGross,
                      entry.totalPar
                    );
                    const netVsPar = formatVsPar(
                      entry.totalNet,
                      entry.totalPar
                    );
                    const avgScore = (
                      entry.totalGross / entry.rounds
                    ).toFixed(1);
                    const best =
                      sortBy === "net" ? entry.bestNet : entry.bestGross;

                    return (
                      <tr
                        key={entry.name}
                        className={`border-b border-zinc-50 ${
                          idx === 0 ? "bg-emerald-50/50" : ""
                        }`}
                      >
                        <td className="px-4 py-3 font-medium text-zinc-500">
                          <div className="flex items-center gap-1.5">
                            {idx === 0 && (
                              <Medal className="h-4 w-4 text-yellow-500" />
                            )}
                            {idx === 1 && (
                              <Medal className="h-4 w-4 text-zinc-400" />
                            )}
                            {idx === 2 && (
                              <Medal className="h-4 w-4 text-amber-600" />
                            )}
                            {idx + 1}
                          </div>
                        </td>
                        <td className="px-4 py-3 font-semibold text-zinc-900">
                          {entry.name}
                        </td>
                        <td className="px-4 py-3 text-center text-zinc-500">
                          {entry.rounds}
                        </td>
                        <td
                          className={`px-4 py-3 text-center font-bold ${
                            entry.totalGross - entry.totalPar > 0
                              ? "text-blue-600"
                              : entry.totalGross - entry.totalPar < 0
                                ? "text-red-600"
                                : "text-zinc-700"
                          }`}
                        >
                          {grossVsPar}
                        </td>
                        <td className="px-4 py-3 text-center text-zinc-600">
                          {avgScore}
                        </td>
                        <td className="px-4 py-3 text-center text-zinc-600">
                          {best ?? "–"}
                        </td>
                        {sortBy === "net" && (
                          <td
                            className={`px-4 py-3 text-center font-bold ${
                              entry.totalNet - entry.totalPar > 0
                                ? "text-blue-600"
                                : entry.totalNet - entry.totalPar < 0
                                  ? "text-red-600"
                                  : "text-zinc-700"
                            }`}
                          >
                            {netVsPar}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
