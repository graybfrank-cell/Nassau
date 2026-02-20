"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { getTrip, getScorecards, createScorecard, deleteScorecard } from "@/lib/store";
import { Trip, Scorecard } from "@/lib/types";
import { ArrowLeft, Plus, ClipboardList, Trash2, AlertCircle } from "lucide-react";

const DEFAULT_PARS = [4, 4, 4, 3, 5, 4, 3, 4, 5, 4, 4, 3, 5, 4, 4, 3, 4, 5];

export default function TripScorecardsPage() {
  const params = useParams();
  const router = useRouter();
  const tripId = params.id as string;

  const [trip, setTrip] = useState<Trip | null>(null);
  const [scorecards, setScorecards] = useState<Scorecard[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [courseName, setCourseName] = useState("");
  const [date, setDate] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const t = await getTrip(tripId);
      if (t) {
        setTrip(t);
        setScorecards(await getScorecards({ tripId }));
        setSelectedMembers(t.members.map((m) => m.id));
      }
      setLoading(false);
    }
    load();
  }, [tripId]);

  async function refresh() {
    setScorecards(await getScorecards({ tripId }));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!trip) return;
    setError(null);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setError("You must be logged in to create a scorecard");
        return;
      }

      const players = trip.members
        .filter((m) => selectedMembers.includes(m.id))
        .map((m) => ({
          id: m.id,
          name: m.name,
          handicap: m.handicap,
          scores: Array(18).fill(null),
        }));

      const sc = await createScorecard({
        userId: user.id,
        tripId,
        courseName: courseName.trim(),
        date,
        pars: DEFAULT_PARS,
        players,
      });

      setCourseName("");
      setDate("");
      setShowForm(false);
      await refresh();
      router.push(`/scorecards/${sc.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create scorecard");
    }
  }

  async function handleDelete(id: string) {
    setError(null);
    try {
      await deleteScorecard(id);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete scorecard");
    }
  }

  function toggleMember(memberId: string) {
    setSelectedMembers((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId]
    );
  }

  if (loading || !trip) {
    return (
      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center">
        <p className="text-sm text-zinc-400">Loading...</p>
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
              Scorecards
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              Track scores for rounds during {trip.name}.
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4" />
            New Scorecard
          </button>
        </div>

        {showForm && (
          <form
            onSubmit={handleCreate}
            className="mt-6 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm"
          >
            <h2 className="text-lg font-semibold text-zinc-900">
              Start a Scorecard
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-zinc-700">
                  Course Name
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
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-zinc-700">
                  Players
                </label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {trip.members.map((member) => (
                    <button
                      key={member.id}
                      type="button"
                      onClick={() => toggleMember(member.id)}
                      className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                        selectedMembers.includes(member.id)
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-zinc-100 text-zinc-400"
                      }`}
                    >
                      {member.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button
                type="submit"
                disabled={selectedMembers.length === 0}
                className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
              >
                Start Round
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

        {scorecards.length === 0 ? (
          <div className="mt-16 text-center">
            <ClipboardList className="mx-auto h-12 w-12 text-zinc-300" />
            <h2 className="mt-4 text-lg font-semibold text-zinc-900">
              No scorecards yet
            </h2>
            <p className="mt-2 text-sm text-zinc-500">
              Start a scorecard to track scores for a round.
            </p>
          </div>
        ) : (
          <div className="mt-8 space-y-3">
            {scorecards.map((sc) => {
              const totalPar = sc.pars.reduce((a, b) => a + b, 0);
              return (
                <div
                  key={sc.id}
                  className="group relative rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
                >
                  <button
                    onClick={() => handleDelete(sc.id)}
                    className="absolute right-3 top-3 rounded-md p-1.5 text-zinc-300 opacity-0 transition-all hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <Link href={`/scorecards/${sc.id}`} className="block">
                    <h3 className="font-semibold text-zinc-900">
                      {sc.courseName || "Untitled Round"}
                    </h3>
                    {sc.date && (
                      <p className="mt-1 text-sm text-zinc-400">{sc.date}</p>
                    )}
                    <div className="mt-2 text-xs text-zinc-500">
                      {sc.players.map((p) => p.name).join(", ")} · Par{" "}
                      {totalPar}
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
