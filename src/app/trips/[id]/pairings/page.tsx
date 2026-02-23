"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getTrip, getRounds, createRound, updateRound, deleteRound } from "@/lib/store";
import { Trip, Round } from "@/lib/types";
import { ArrowLeft, Plus, Shuffle, Trash2, Users, AlertCircle } from "lucide-react";

function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function makeGroups(memberIds: string[], groupSize: number): string[][] {
  const shuffled = shuffle(memberIds);
  const groups: string[][] = [];
  for (let i = 0; i < shuffled.length; i += groupSize) {
    groups.push(shuffled.slice(i, i + groupSize));
  }
  return groups;
}

export default function PairingsPage() {
  const params = useParams();
  const tripId = params.id as string;

  const [trip, setTrip] = useState<Trip | null>(null);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [roundName, setRoundName] = useState("");
  const [courseName, setCourseName] = useState("");
  const [roundDate, setRoundDate] = useState("");
  const [groupSize, setGroupSize] = useState(4);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId]);

  async function refresh() {
    const t = await getTrip(tripId);
    if (t) {
      setTrip(t);
      setRounds(await getRounds(tripId));
    }
  }

  function getMemberName(memberId: string): string {
    return trip?.members.find((m) => m.id === memberId)?.name || "Unknown";
  }

  function getMemberHandicap(memberId: string): number {
    return trip?.members.find((m) => m.id === memberId)?.handicap || 0;
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!trip || !roundName.trim()) return;
    setError(null);
    try {
      const memberIds = trip.members.map((m) => m.id);
      const groups = makeGroups(memberIds, groupSize);
      await createRound({
        tripId,
        name: roundName.trim(),
        courseName: courseName.trim(),
        date: roundDate,
        groupSize,
        groups,
      });
      setRoundName("");
      setCourseName("");
      setRoundDate("");
      setShowForm(false);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create round");
    }
  }

  async function handleReshuffle(roundId: string) {
    if (!trip) return;
    setError(null);
    try {
      const memberIds = trip.members.map((m) => m.id);
      const groups = makeGroups(memberIds, groupSize);
      await updateRound(roundId, { groups });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reshuffle");
    }
  }

  async function handleDeleteRound(roundId: string) {
    setError(null);
    try {
      await deleteRound(roundId);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete round");
    }
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
      <div className="mx-auto max-w-4xl">
        <Link
          href={`/trips/${tripId}`}
          className="inline-flex items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-zinc-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to {trip.name}
        </Link>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <div className="mt-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
              Pairings
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              Generate random groups for each round.
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4" />
            New Round
          </button>
        </div>

        {trip.members.length < 2 && (
          <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
            Add at least 2 members to generate pairings.{" "}
            <Link
              href={`/trips/${tripId}`}
              className="font-medium underline hover:no-underline"
            >
              Go to trip
            </Link>
          </div>
        )}

        {/* Create Round Form */}
        {showForm && trip.members.length >= 2 && (
          <form
            onSubmit={handleCreate}
            className="mt-6 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm"
          >
            <h2 className="text-lg font-semibold text-zinc-900">New Round</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-zinc-700">
                  Round Name *
                </label>
                <input
                  type="text"
                  required
                  value={roundName}
                  onChange={(e) => setRoundName(e.target.value)}
                  placeholder="Round 1"
                  className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700">
                  Course
                </label>
                <input
                  type="text"
                  value={courseName}
                  onChange={(e) => setCourseName(e.target.value)}
                  placeholder="TPC Scottsdale"
                  className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700">
                  Date
                </label>
                <input
                  type="date"
                  value={roundDate}
                  onChange={(e) => setRoundDate(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700">
                  Group Size
                </label>
                <select
                  value={groupSize}
                  onChange={(e) => setGroupSize(parseInt(e.target.value))}
                  className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value={2}>Twosomes</option>
                  <option value={3}>Threesomes</option>
                  <option value={4}>Foursomes</option>
                </select>
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button
                type="submit"
                className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
              >
                Generate Pairings
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

        {/* Rounds List */}
        {rounds.length === 0 ? (
          <div className="mt-12 text-center">
            <Users className="mx-auto h-12 w-12 text-zinc-300" />
            <p className="mt-4 text-sm text-zinc-500">
              No rounds created yet.
            </p>
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            {rounds.map((round) => (
              <div
                key={round.id}
                className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-zinc-900">
                      {round.name}
                    </h3>
                    <p className="text-xs text-zinc-400">
                      {[round.courseName, round.date]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleReshuffle(round.id)}
                      className="inline-flex items-center gap-1.5 rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-50"
                    >
                      <Shuffle className="h-3.5 w-3.5" />
                      Reshuffle
                    </button>
                    <button
                      onClick={() => handleDeleteRound(round.id)}
                      className="rounded-md border border-zinc-300 p-1.5 text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-500"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {round.groups.map((group, gi) => (
                    <div
                      key={gi}
                      className="rounded-lg border border-zinc-100 bg-zinc-50 p-3"
                    >
                      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                        Group {gi + 1}
                      </p>
                      <div className="mt-2 space-y-1.5">
                        {group.map((memberId) => (
                          <div
                            key={memberId}
                            className="flex items-center justify-between"
                          >
                            <span className="text-sm text-zinc-700">
                              {getMemberName(memberId)}
                            </span>
                            <span className="text-xs text-zinc-400">
                              HCP {getMemberHandicap(memberId)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
