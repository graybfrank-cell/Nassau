"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { getScorecards, createScorecard, deleteScorecard } from "@/lib/store";
import { Scorecard } from "@/lib/types";
import { Plus, ClipboardList, Trash2, ArrowLeft } from "lucide-react";

const DEFAULT_PARS = [4, 4, 4, 3, 5, 4, 3, 4, 5, 4, 4, 3, 5, 4, 4, 3, 4, 5];

export default function ScorecardsPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [scorecards, setScorecards] = useState<Scorecard[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [courseName, setCourseName] = useState("");
  const [date, setDate] = useState("");
  const [playerNames, setPlayerNames] = useState("");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (user) {
        setUserId(user.id);
        setScorecards(await getScorecards({ userId: user.id }));
      } else {
        router.push("/login");
      }
      setLoading(false);
    });
  }, [router]);

  async function refresh() {
    if (userId) setScorecards(await getScorecards({ userId }));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!userId || !playerNames.trim()) return;

    const players = playerNames
      .split(",")
      .map((name) => name.trim())
      .filter(Boolean)
      .map((name) => ({
        id: crypto.randomUUID(),
        name,
        handicap: 0,
        scores: Array(18).fill(null),
      }));

    const sc = await createScorecard({
      userId,
      tripId: null,
      courseName: courseName.trim(),
      date,
      pars: DEFAULT_PARS,
      players,
    });

    setCourseName("");
    setDate("");
    setPlayerNames("");
    setShowForm(false);
    await refresh();
    router.push(`/scorecards/${sc.id}`);
  }

  async function handleDelete(id: string) {
    await deleteScorecard(id);
    await refresh();
  }

  if (loading) {
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
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-zinc-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Dashboard
        </Link>

        <div className="mt-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
              Scorecards
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              Keep score for any round with friends.
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
                  Players *
                </label>
                <input
                  type="text"
                  required
                  value={playerNames}
                  onChange={(e) => setPlayerNames(e.target.value)}
                  placeholder="John, Mike, Dave, Steve"
                  className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
                <p className="mt-1 text-xs text-zinc-400">
                  Comma-separated names
                </p>
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button
                type="submit"
                className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
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
              Start a scorecard to keep score for your next round.
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
                      {sc.players.length} player
                      {sc.players.length !== 1 ? "s" : ""} · Par {totalPar}
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
