"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createGameRound } from "@/lib/game-store";
import { ArrowLeft, Plus, X, AlertCircle } from "lucide-react";
import CourseSearch from "@/components/shared/CourseSearch";

const STAKE_PILLS = [5, 10, 20, 50];

function getNextSaturday(): string {
  const d = new Date();
  const day = d.getDay();
  const daysUntilSaturday = (6 - day + 7) % 7 || 7;
  d.setDate(d.getDate() + daysUntilSaturday);
  return d.toISOString().split("T")[0];
}

export default function NewRoundPage() {
  const router = useRouter();

  // Course
  const [courseName, setCourseName] = useState("");
  const [courseId, setCourseId] = useState<string | undefined>();
  const [courseLocation, setCourseLocation] = useState<string | undefined>();
  const [courseLat, setCourseLat] = useState<number | undefined>();
  const [courseLng, setCourseLng] = useState<number | undefined>();

  // Date & Time
  const [date, setDate] = useState(getNextSaturday());
  const [time, setTime] = useState("08:00");

  // Skins
  const [skinsEnabled, setSkinsEnabled] = useState(false);
  const [buyIn, setBuyIn] = useState("20");

  // Nassau Bet
  const [nassauEnabled, setNassauEnabled] = useState(false);
  const [nassauBetAmount, setNassauBetAmount] = useState("10");

  // Notes
  const [notes, setNotes] = useState("");

  // Players
  const [players, setPlayers] = useState<{ name: string; email?: string }[]>(
    []
  );
  const [newPlayerName, setNewPlayerName] = useState("");
  const [newPlayerEmail, setNewPlayerEmail] = useState("");
  const [addMode, setAddMode] = useState<"name" | "email">("name");

  // State
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addPlayer() {
    if (addMode === "name" && newPlayerName.trim()) {
      setPlayers((prev) => [...prev, { name: newPlayerName.trim() }]);
      setNewPlayerName("");
    } else if (addMode === "email" && newPlayerEmail.trim()) {
      setPlayers((prev) => [
        ...prev,
        {
          name: newPlayerEmail.split("@")[0],
          email: newPlayerEmail.trim(),
        },
      ]);
      setNewPlayerEmail("");
    }
  }

  function removePlayer(index: number) {
    setPlayers((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!courseName.trim()) return;

    setSubmitting(true);
    setError(null);
    try {
      const teeTime = new Date(`${date}T${time}:00`).toISOString();

      const round = await createGameRound({
        courseName: courseName.trim(),
        courseId,
        courseLocation,
        courseLat,
        courseLng,
        teeTime,
        notes: notes.trim() || undefined,
        skinsGame: skinsEnabled
          ? { buyIn: parseFloat(buyIn) || 20 }
          : undefined,
        nassauBet: nassauEnabled
          ? { betAmount: parseFloat(nassauBetAmount) || 10 }
          : undefined,
        players,
      });

      router.push(`/rounds/${round.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create round");
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-zinc-50 px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/rounds"
          className="inline-flex items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-zinc-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Rounds
        </Link>

        <h1 className="mt-6 text-2xl font-bold tracking-tight text-zinc-900">
          New Round
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Set up a round — pick a course, add your crew, and go.
        </p>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          {/* Course */}
          <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
            <label className="block text-sm font-semibold text-zinc-900">
              Course *
            </label>
            <div className="mt-2">
              <CourseSearch
                value={courseName}
                onChange={setCourseName}
                onCourseSelect={(course) => {
                  setCourseId(course.id);
                  setCourseLocation(course.location || undefined);
                  setCourseLat(course.lat);
                  setCourseLng(course.lng);
                }}
                placeholder="Search for a course..."
              />
            </div>
            {!courseId && courseName && (
              <p className="mt-1 text-xs text-zinc-400">
                Using manual entry: {courseName}
              </p>
            )}
          </div>

          {/* Date & Time */}
          <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
            <label className="block text-sm font-semibold text-zinc-900">
              Date & Tee Time
            </label>
            <div className="mt-2 grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-600">
                  Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600">
                  Time
                </label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            </div>
          </div>

          {/* Skins Game */}
          <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-zinc-900">
                Skins Game
              </label>
              <button
                type="button"
                onClick={() => setSkinsEnabled(!skinsEnabled)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
                  skinsEnabled ? "bg-emerald-600" : "bg-zinc-200"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${
                    skinsEnabled ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {skinsEnabled && (
              <div className="mt-3">
                <label className="block text-xs font-medium text-zinc-600">
                  Buy-in
                </label>
                <div className="mt-1.5 flex items-center gap-2">
                  {STAKE_PILLS.map((amount) => (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => setBuyIn(String(amount))}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                        buyIn === String(amount)
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
                      }`}
                    >
                      ${amount}
                    </button>
                  ))}
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-zinc-400">
                      $
                    </span>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={buyIn}
                      onChange={(e) => setBuyIn(e.target.value)}
                      className="w-20 rounded-lg border border-zinc-300 py-1.5 pl-6 pr-2 text-xs text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Nassau Bet */}
          <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-zinc-900">
                Nassau Bet
              </label>
              <button
                type="button"
                onClick={() => setNassauEnabled(!nassauEnabled)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
                  nassauEnabled ? "bg-emerald-600" : "bg-zinc-200"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${
                    nassauEnabled ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {nassauEnabled && (
              <div className="mt-3">
                <label className="block text-xs font-medium text-zinc-600">
                  Per-bet amount
                </label>
                <div className="mt-1.5 flex items-center gap-2">
                  {STAKE_PILLS.map((amount) => (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => setNassauBetAmount(String(amount))}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                        nassauBetAmount === String(amount)
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
                      }`}
                    >
                      ${amount}
                    </button>
                  ))}
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-zinc-400">
                      $
                    </span>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={nassauBetAmount}
                      onChange={(e) => setNassauBetAmount(e.target.value)}
                      className="w-20 rounded-lg border border-zinc-300 py-1.5 pl-6 pr-2 text-xs text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                </div>
                <p className="mt-2 text-xs text-zinc-400">
                  3 bets: front 9, back 9, total 18 &middot; Total at risk: $
                  {(parseFloat(nassauBetAmount) || 0) * 3} per player
                </p>
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
            <label className="block text-sm font-semibold text-zinc-900">
              Notes
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Meet at the range at 7:30"
              className="mt-2 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          {/* Players */}
          <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
            <label className="block text-sm font-semibold text-zinc-900">
              Add Players
            </label>
            <p className="mt-0.5 text-xs text-zinc-400">
              You&apos;re automatically added as Commissioner. Add others here.
            </p>

            {players.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {players.map((p, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700"
                  >
                    {p.name}
                    {p.email && (
                      <span className="text-zinc-400"> ({p.email})</span>
                    )}
                    <button
                      type="button"
                      onClick={() => removePlayer(i)}
                      className="ml-0.5 text-zinc-400 hover:text-zinc-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => setAddMode("name")}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  addMode === "name"
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-zinc-100 text-zinc-500"
                }`}
              >
                By Name
              </button>
              <button
                type="button"
                onClick={() => setAddMode("email")}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  addMode === "email"
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-zinc-100 text-zinc-500"
                }`}
              >
                By Email
              </button>
            </div>

            <div className="mt-2 flex gap-2">
              {addMode === "name" ? (
                <input
                  type="text"
                  value={newPlayerName}
                  onChange={(e) => setNewPlayerName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addPlayer();
                    }
                  }}
                  placeholder="Player name"
                  className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              ) : (
                <input
                  type="email"
                  value={newPlayerEmail}
                  onChange={(e) => setNewPlayerEmail(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addPlayer();
                    }
                  }}
                  placeholder="player@email.com"
                  className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              )}
              <button
                type="button"
                onClick={addPlayer}
                className="inline-flex items-center gap-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-50"
              >
                <Plus className="h-3.5 w-3.5" />
                Add
              </button>
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting || !courseName.trim()}
              className="rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "Creating..." : "Create Round"}
            </button>
            <Link
              href="/rounds"
              className="rounded-lg border border-zinc-300 px-6 py-2.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-50"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
