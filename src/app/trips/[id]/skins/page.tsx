"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  getTrip,
  getSkinsGames,
  createSkinsGame,
  updateSkinsGame,
  deleteSkinsGame,
} from "@/lib/store";
import { Trip, SkinsGame, SkinsHole } from "@/lib/types";
import { ArrowLeft, Plus, Trash2, Trophy, ChevronDown, ChevronUp } from "lucide-react";

function calculateResults(game: SkinsGame) {
  const totals: Record<string, { skins: number; winnings: number }> = {};
  game.players.forEach((p) => {
    totals[p] = { skins: 0, winnings: 0 };
  });

  const holeResults: {
    number: number;
    winner: string | null;
    skinsValue: number;
    carryover: boolean;
  }[] = [];
  let carryover = 0;

  for (let i = 0; i < 18; i++) {
    const hole = game.holes[i];
    if (!hole || Object.keys(hole.scores).length === 0) {
      holeResults.push({
        number: i + 1,
        winner: null,
        skinsValue: 0,
        carryover: false,
      });
      continue;
    }

    const scores = Object.entries(hole.scores).filter(
      ([id]) => game.players.includes(id) && hole.scores[id] > 0
    );

    if (scores.length === 0) {
      holeResults.push({
        number: i + 1,
        winner: null,
        skinsValue: 0,
        carryover: false,
      });
      continue;
    }

    const minScore = Math.min(...scores.map(([, s]) => s));
    const winners = scores.filter(([, s]) => s === minScore);

    if (winners.length === 1) {
      const winnerId = winners[0][0];
      const skinsValue = 1 + carryover;
      holeResults.push({
        number: i + 1,
        winner: winnerId,
        skinsValue,
        carryover: false,
      });
      if (totals[winnerId]) {
        totals[winnerId].skins += skinsValue;
        totals[winnerId].winnings += skinsValue * game.stake;
      }
      carryover = 0;
    } else {
      carryover += 1;
      holeResults.push({
        number: i + 1,
        winner: null,
        skinsValue: 0,
        carryover: true,
      });
    }
  }

  return { holeResults, totals };
}

export default function SkinsPage() {
  const params = useParams();
  const tripId = params.id as string;

  const [trip, setTrip] = useState<Trip | null>(null);
  const [games, setGames] = useState<SkinsGame[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [gameName, setGameName] = useState("");
  const [stake, setStake] = useState("5");
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [expandedGame, setExpandedGame] = useState<string | null>(null);

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId]);

  function refresh() {
    const t = getTrip(tripId);
    if (t) {
      setTrip(t);
      setGames(getSkinsGames(tripId));
    }
  }

  function getMemberName(memberId: string): string {
    return trip?.members.find((m) => m.id === memberId)?.name || "Unknown";
  }

  function togglePlayer(memberId: string) {
    setSelectedPlayers((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId]
    );
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!gameName.trim() || selectedPlayers.length < 2) return;

    const holes: SkinsHole[] = Array.from({ length: 18 }, (_, i) => ({
      number: i + 1,
      scores: {},
    }));

    createSkinsGame({
      tripId,
      name: gameName.trim(),
      players: selectedPlayers,
      stake: parseFloat(stake) || 5,
      holes,
    });
    setGameName("");
    setStake("5");
    setSelectedPlayers([]);
    setShowForm(false);
    refresh();
  }

  function handleScoreChange(
    gameId: string,
    holeIndex: number,
    playerId: string,
    value: string
  ) {
    const game = games.find((g) => g.id === gameId);
    if (!game) return;

    const updatedHoles = [...game.holes];
    const hole = { ...updatedHoles[holeIndex] };
    hole.scores = { ...hole.scores };

    if (value === "" || value === "0") {
      delete hole.scores[playerId];
    } else {
      hole.scores[playerId] = parseInt(value) || 0;
    }
    updatedHoles[holeIndex] = hole;

    updateSkinsGame(gameId, { holes: updatedHoles });
    refresh();
  }

  function handleDeleteGame(gameId: string) {
    deleteSkinsGame(gameId);
    if (expandedGame === gameId) setExpandedGame(null);
    refresh();
  }

  if (!trip) {
    return (
      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center">
        <p className="text-sm text-zinc-400">Trip not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-zinc-50 px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <Link
          href={`/trips/${tripId}`}
          className="inline-flex items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-zinc-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to {trip.name}
        </Link>

        <div className="mt-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
              Skins Games
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              Track skins with automatic scoring and carryovers.
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4" />
            New Game
          </button>
        </div>

        {trip.members.length < 2 && (
          <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
            Add at least 2 members to start a skins game.{" "}
            <Link
              href={`/trips/${tripId}`}
              className="font-medium underline hover:no-underline"
            >
              Go to trip
            </Link>
          </div>
        )}

        {/* Create Game Form */}
        {showForm && trip.members.length >= 2 && (
          <form
            onSubmit={handleCreate}
            className="mt-6 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm"
          >
            <h2 className="text-lg font-semibold text-zinc-900">
              New Skins Game
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-zinc-700">
                  Game Name *
                </label>
                <input
                  type="text"
                  required
                  value={gameName}
                  onChange={(e) => setGameName(e.target.value)}
                  placeholder="Saturday Skins"
                  className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700">
                  Stake per Skin ($)
                </label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={stake}
                  onChange={(e) => setStake(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-zinc-700">
                  Players * (select at least 2)
                </label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {trip.members.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => togglePlayer(m.id)}
                      className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                        selectedPlayers.includes(m.id)
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
                      }`}
                    >
                      {m.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button
                type="submit"
                disabled={selectedPlayers.length < 2}
                className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Create Game
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-lg border border-zinc-300 px-5 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-50"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Games List */}
        {games.length === 0 ? (
          <div className="mt-12 text-center">
            <Trophy className="mx-auto h-12 w-12 text-zinc-300" />
            <p className="mt-4 text-sm text-zinc-500">No skins games yet.</p>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {games.map((game) => {
              const { holeResults, totals } = calculateResults(game);
              const isExpanded = expandedGame === game.id;
              const totalSkinsWon = Object.values(totals).reduce(
                (sum, t) => sum + t.skins,
                0
              );

              return (
                <div
                  key={game.id}
                  className="rounded-xl border border-zinc-200 bg-white shadow-sm"
                >
                  {/* Game Header */}
                  <div
                    className="flex cursor-pointer items-center justify-between p-5"
                    onClick={() =>
                      setExpandedGame(isExpanded ? null : game.id)
                    }
                  >
                    <div>
                      <h3 className="font-semibold text-zinc-900">
                        {game.name}
                      </h3>
                      <p className="text-xs text-zinc-400">
                        {game.players.length} players · $
                        {game.stake.toFixed(2)}/skin · {totalSkinsWon} skin
                        {totalSkinsWon !== 1 ? "s" : ""} won
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteGame(game.id);
                        }}
                        className="rounded-md p-1.5 text-zinc-300 transition-colors hover:bg-red-50 hover:text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5 text-zinc-400" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-zinc-400" />
                      )}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-zinc-100 p-5">
                      {/* Scorecard */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-zinc-200">
                              <th className="px-2 py-2 text-left text-xs font-semibold text-zinc-500">
                                Hole
                              </th>
                              {game.players.map((playerId) => (
                                <th
                                  key={playerId}
                                  className="px-2 py-2 text-center text-xs font-semibold text-zinc-500"
                                >
                                  {getMemberName(playerId)}
                                </th>
                              ))}
                              <th className="px-2 py-2 text-center text-xs font-semibold text-zinc-500">
                                Result
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {Array.from({ length: 18 }, (_, i) => {
                              const hole = game.holes[i];
                              const result = holeResults[i];
                              return (
                                <tr
                                  key={i}
                                  className={`border-b border-zinc-50 ${
                                    i === 8
                                      ? "border-b-2 border-b-zinc-200"
                                      : ""
                                  }`}
                                >
                                  <td className="px-2 py-1.5 text-xs font-medium text-zinc-600">
                                    {i + 1}
                                  </td>
                                  {game.players.map((playerId) => (
                                    <td
                                      key={playerId}
                                      className="px-1 py-1"
                                    >
                                      <input
                                        type="number"
                                        min="1"
                                        max="15"
                                        value={hole?.scores[playerId] || ""}
                                        onChange={(e) =>
                                          handleScoreChange(
                                            game.id,
                                            i,
                                            playerId,
                                            e.target.value
                                          )
                                        }
                                        className="w-12 rounded border border-zinc-200 px-1.5 py-1 text-center text-xs text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/20"
                                        placeholder="-"
                                      />
                                    </td>
                                  ))}
                                  <td className="px-2 py-1.5 text-center text-xs">
                                    {result?.winner ? (
                                      <span className="font-semibold text-emerald-600">
                                        {getMemberName(result.winner)}
                                        {result.skinsValue > 1 &&
                                          ` (${result.skinsValue})`}
                                      </span>
                                    ) : result?.carryover ? (
                                      <span className="text-amber-500">
                                        Carry
                                      </span>
                                    ) : (
                                      <span className="text-zinc-300">-</span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* Results Summary */}
                      <div className="mt-6 rounded-lg bg-zinc-50 p-4">
                        <h4 className="text-sm font-semibold text-zinc-700">
                          Results
                        </h4>
                        <div className="mt-3 space-y-2">
                          {game.players
                            .sort(
                              (a, b) =>
                                (totals[b]?.skins || 0) -
                                (totals[a]?.skins || 0)
                            )
                            .map((playerId) => {
                              const t = totals[playerId];
                              return (
                                <div
                                  key={playerId}
                                  className="flex items-center justify-between"
                                >
                                  <span className="text-sm text-zinc-700">
                                    {getMemberName(playerId)}
                                  </span>
                                  <div className="flex items-center gap-4">
                                    <span className="text-xs text-zinc-400">
                                      {t?.skins || 0} skin
                                      {(t?.skins || 0) !== 1 ? "s" : ""}
                                    </span>
                                    <span
                                      className={`text-sm font-semibold ${
                                        (t?.winnings || 0) > 0
                                          ? "text-emerald-600"
                                          : "text-zinc-400"
                                      }`}
                                    >
                                      ${(t?.winnings || 0).toFixed(2)}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
