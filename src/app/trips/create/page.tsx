"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { generateTripName } from "@/lib/trip-name-generator";

const VIBES = [
  {
    id: "competitive",
    emoji: "\uD83C\uDFC6",
    title: "Competitive",
    subtitle: "All about the golf. Skins, scorecards, bragging rights.",
  },
  {
    id: "party",
    emoji: "\uD83C\uDF89",
    title: "Party",
    subtitle: "Golf by day, nightlife by night. Bachelor party energy.",
  },
  {
    id: "relaxed",
    emoji: "\uD83E\uDDD8",
    title: "Relaxed",
    subtitle: "Chill rounds, nice dinners, no alarms.",
  },
  {
    id: "father-son",
    emoji: "\uD83D\uDC68\u200D\uD83D\uDC66",
    title: "Father-Son",
    subtitle: "Meaningful time on the course together.",
  },
  {
    id: "corporate",
    emoji: "\uD83D\uDCBC",
    title: "Corporate",
    subtitle: "Team building meets tee times.",
  },
  {
    id: "bucket-list",
    emoji: "\uD83C\uDFDD\uFE0F",
    title: "Bucket List",
    subtitle: "The dream trip. Once in a lifetime courses.",
  },
];

const GROUP_SIZES = [2, 4, 6, 8, 10, 12, 16];

const BUDGETS = [
  {
    id: "budget",
    label: "Budget",
    icon: "\uD83D\uDCB0",
    subtitle: "Under $150/day",
  },
  {
    id: "mid-range",
    label: "Mid-Range",
    icon: "\uD83D\uDCB0\uD83D\uDCB0",
    subtitle: "$150\u2013350/day",
  },
  {
    id: "premium",
    label: "Premium",
    icon: "\uD83D\uDCB0\uD83D\uDCB0\uD83D\uDCB0",
    subtitle: "$350\u2013600/day",
  },
  {
    id: "luxury",
    label: "Luxury",
    icon: "\uD83D\uDCB0\uD83D\uDCB0\uD83D\uDCB0\uD83D\uDCB0",
    subtitle: "$600+/day",
  },
];

export default function CreateTripWizardPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1
  const [vibe, setVibe] = useState<string | null>(null);
  // Step 2
  const [destination, setDestination] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  // Step 3
  const [groupSize, setGroupSize] = useState(4);
  const [budgetTier, setBudgetTier] = useState<string | null>(null);
  // Step 4
  const [tripName, setTripName] = useState("");
  const [notes, setNotes] = useState("");
  const [nameGenerated, setNameGenerated] = useState(false);

  function calcDuration() {
    if (!startDate || !endDate) return null;
    const start = new Date(startDate + "T12:00:00");
    const end = new Date(endDate + "T12:00:00");
    const diff = Math.round(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diff <= 0) return null;
    return `${diff} night${diff !== 1 ? "s" : ""}, ${diff + 1} day${diff + 1 !== 1 ? "s" : ""}`;
  }

  function goNext() {
    if (step === 3 && !nameGenerated) {
      setTripName(generateTripName(vibe, destination));
      setNameGenerated(true);
    }
    setStep((s) => Math.min(s + 1, 4));
  }

  function goBack() {
    setStep((s) => Math.max(s - 1, 1));
  }

  function canProceed(): boolean {
    if (step === 1) return !!vibe;
    if (step === 2) return !!destination.trim();
    if (step === 3) return !!budgetTier;
    return true;
  }

  async function handleSubmit() {
    if (!tripName.trim()) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: tripName.trim(),
          destination: destination.trim(),
          startDate,
          endDate,
          vibe,
          budgetTier,
          groupSizeTarget: groupSize,
          notes: notes.trim() || null,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Failed to create trip (${res.status})`);
      }

      const trip = await res.json();
      router.push(`/trips/${trip.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create trip");
      setSubmitting(false);
    }
  }

  const duration = calcDuration();

  return (
    <div className="min-h-[calc(100vh-64px)] bg-zinc-50 px-6 py-10">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/trips/new"
          className="inline-flex items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-zinc-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>

        {/* Progress bar */}
        <div className="mt-6 flex items-center gap-2">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                s <= step ? "bg-emerald-500" : "bg-zinc-200"
              }`}
            />
          ))}
        </div>
        <p className="mt-2 text-xs text-zinc-400">Step {step} of 4</p>

        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Step 1: Vibe */}
        {step === 1 && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold tracking-tight text-zinc-900">
              What&apos;s the vibe?
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              Pick the one that best describes your trip.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {VIBES.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setVibe(v.id)}
                  className={`rounded-xl border-2 p-4 text-left transition-all ${
                    vibe === v.id
                      ? "border-emerald-500 bg-emerald-50 shadow-md"
                      : "border-zinc-200 bg-white hover:border-zinc-300 hover:shadow-sm"
                  }`}
                >
                  <span className="text-2xl">{v.emoji}</span>
                  <h3 className="mt-2 font-semibold text-zinc-900">
                    {v.title}
                  </h3>
                  <p className="mt-0.5 text-xs text-zinc-500">{v.subtitle}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Destination & Dates */}
        {step === 2 && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold tracking-tight text-zinc-900">
              Where &amp; when?
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              Tell us the destination and dates.
            </p>
            <div className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700">
                  Where are you headed? *
                </label>
                <input
                  type="text"
                  value={destination}
                  onChange={(e) => {
                    setDestination(e.target.value);
                    setNameGenerated(false);
                  }}
                  placeholder="e.g., Scottsdale, AZ"
                  className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-zinc-700">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>
              {duration && (
                <p className="text-sm font-medium text-emerald-600">
                  {duration}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Group Details */}
        {step === 3 && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold tracking-tight text-zinc-900">
              Group details
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              How many golfers, and what&apos;s the budget?
            </p>
            <div className="mt-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-zinc-700">
                  How many golfers?
                </label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {GROUP_SIZES.map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setGroupSize(size)}
                      className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                        groupSize === size
                          ? "bg-emerald-600 text-white"
                          : "bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700">
                  Budget per person
                </label>
                <div className="mt-2 grid gap-3 sm:grid-cols-2">
                  {BUDGETS.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setBudgetTier(b.id)}
                      className={`rounded-xl border-2 p-3 text-left transition-all ${
                        budgetTier === b.id
                          ? "border-emerald-500 bg-emerald-50 shadow-md"
                          : "border-zinc-200 bg-white hover:border-zinc-300"
                      }`}
                    >
                      <span className="text-lg">{b.icon}</span>
                      <h3 className="mt-1 text-sm font-semibold text-zinc-900">
                        {b.label}
                      </h3>
                      <p className="text-xs text-zinc-500">{b.subtitle}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Name & Summary */}
        {step === 4 && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold tracking-tight text-zinc-900">
              Name your trip
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              We generated a name for you &mdash; feel free to change it.
            </p>
            <div className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700">
                  Trip Name *
                </label>
                <input
                  type="text"
                  value={tripName}
                  onChange={(e) => setTripName(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-lg font-semibold text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700">
                  Anything else the crew should know?
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Optional notes, ideas, or instructions..."
                  className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              {/* Summary card */}
              <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-zinc-500">
                  Trip Summary
                </h3>
                <div className="mt-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500">Vibe</span>
                    <span className="font-medium text-zinc-900">
                      {VIBES.find((v) => v.id === vibe)?.emoji}{" "}
                      {VIBES.find((v) => v.id === vibe)?.title}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500">Destination</span>
                    <span className="font-medium text-zinc-900">
                      {destination}
                    </span>
                  </div>
                  {duration && (
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-500">Duration</span>
                      <span className="font-medium text-zinc-900">
                        {duration}
                      </span>
                    </div>
                  )}
                  {(startDate || endDate) && (
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-500">Dates</span>
                      <span className="font-medium text-zinc-900">
                        {startDate} {startDate && endDate ? "\u2014" : ""}{" "}
                        {endDate}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500">Group Size</span>
                    <span className="font-medium text-zinc-900">
                      {groupSize} golfers
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500">Budget</span>
                    <span className="font-medium text-zinc-900">
                      {BUDGETS.find((b) => b.id === budgetTier)?.label || "\u2014"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="mt-8 flex items-center justify-between">
          {step > 1 ? (
            <button
              type="button"
              onClick={goBack}
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-50"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <button
              type="button"
              onClick={goNext}
              disabled={!canProceed()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || !tripName.trim()}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Trip"
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
