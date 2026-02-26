"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Loader2,
  MapPin,
  Calendar,
  Users,
  DollarSign,
  Sparkles,
  Trophy,
} from "lucide-react";

/* ─── Types ───────────────────────────────────────────────── */

interface IdeateRequest {
  vibe: string;
  group_size: number;
  budget_tier: string;
  dates: {
    start_date?: string;
    end_date?: string;
    season?: string;
    flexible: boolean;
  };
  priorities: string[];
  notes?: string;
}

interface CourseItem {
  name: string;
  day: number;
  time: string;
  estimated_fee: number;
  why: string;
}

interface ItineraryDay {
  day: number;
  title: string;
  items: {
    time: string;
    title: string;
    type: string;
    cost_pp: number;
  }[];
}

interface TripConcept {
  concept_name: string;
  destination: string;
  destination_id: string;
  tagline: string;
  vibe_match: string;
  badge?: string;
  duration_nights: number;
  estimated_cost_pp: number;
  cost_breakdown: {
    golf: number;
    lodging: number;
    food: number;
    transport: number;
    other: number;
  };
  courses: CourseItem[];
  lodging: {
    name: string;
    type: string;
    per_night: number;
    why: string;
  };
  highlights: string[];
  insider_tip: string;
  itinerary: ItineraryDay[];
}

/* ─── Constants ───────────────────────────────────────────── */

const VIBES = [
  { id: "competitive", emoji: "\uD83C\uDFC6", label: "Competitive" },
  { id: "party", emoji: "\uD83C\uDF89", label: "Party" },
  { id: "relaxed", emoji: "\uD83E\uDDD8", label: "Relaxed" },
  { id: "father-son", emoji: "\uD83D\uDC68\u200D\uD83D\uDC66", label: "Father-Son" },
  { id: "corporate", emoji: "\uD83D\uDCBC", label: "Corporate" },
  { id: "bucket-list", emoji: "\uD83C\uDFDD\uFE0F", label: "Bucket List" },
];

const GROUP_SIZES = [2, 4, 6, 8, 10, 12, 16];

const BUDGETS = [
  { id: "budget", label: "Budget", desc: "Under $150/day", icon: "$" },
  { id: "mid", label: "Mid-Range", desc: "$150-350/day", icon: "$$" },
  { id: "premium", label: "Premium", desc: "$350-600/day", icon: "$$$" },
  { id: "luxury", label: "Luxury", desc: "$600+/day", icon: "$$$$" },
];

const SEASONS = [
  { id: "spring", label: "Spring 2026" },
  { id: "summer", label: "Summer 2026" },
  { id: "fall", label: "Fall 2026" },
  { id: "winter", label: "Winter 2026/27" },
  { id: "flexible", label: "Flexible" },
];

const PRIORITIES = [
  { id: "Elite courses", emoji: "\uD83C\uDFCC\uFE0F" },
  { id: "Great food scene", emoji: "\uD83C\uDF54" },
  { id: "Beach access", emoji: "\uD83C\uDF0A" },
  { id: "Nightlife", emoji: "\uD83C\uDFB5" },
  { id: "Best value", emoji: "\uD83D\uDCB8" },
  { id: "Perfect weather", emoji: "\u2600\uFE0F" },
  { id: "Scenic beauty", emoji: "\uD83C\uDFD4\uFE0F" },
  { id: "Craft beer/bourbon", emoji: "\uD83C\uDF7A" },
  { id: "Casino/entertainment", emoji: "\uD83C\uDFB0" },
  { id: "Off the beaten path", emoji: "\uD83C\uDF3F" },
];

/* ─── Main Component ─────────────────────────────────────── */

export default function AITripPlanningPage() {
  const router = useRouter();

  // Question answers
  const [vibe, setVibe] = useState<string | null>(null);
  const [groupSize, setGroupSize] = useState<number | null>(null);
  const [budgetTier, setBudgetTier] = useState<string | null>(null);
  const [dateMode, setDateMode] = useState<"exact" | "season" | null>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [season, setSeason] = useState<string | null>(null);
  const [priorities, setPriorities] = useState<string[]>([]);
  const [notes, setNotes] = useState("");

  // Flow state
  const [step, setStep] = useState(1);
  const [generating, setGenerating] = useState(false);
  const [concepts, setConcepts] = useState<TripConcept[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState<string | null>(null);

  const totalSteps = 6;

  /* ─── Handlers ─────────────────────────────────────────── */

  function selectVibe(v: string) {
    setVibe(v);
    setStep(2);
  }

  function selectGroupSize(n: number) {
    setGroupSize(n);
    setStep(3);
  }

  function selectBudget(b: string) {
    setBudgetTier(b);
    setStep(4);
  }

  function selectSeason(s: string) {
    setSeason(s);
    setDateMode("season");
    if (s === "flexible") {
      setStartDate("");
      setEndDate("");
    }
    setStep(5);
  }

  function confirmDates() {
    if (startDate && endDate) {
      setDateMode("exact");
      setStep(5);
    }
  }

  function togglePriority(p: string) {
    setPriorities((prev) => {
      if (prev.includes(p)) return prev.filter((x) => x !== p);
      if (prev.length >= 3) return prev;
      return [...prev, p];
    });
  }

  function confirmPriorities() {
    setStep(6);
  }

  function goBack() {
    if (concepts) {
      setConcepts(null);
      setError(null);
      return;
    }
    if (step > 1) setStep(step - 1);
  }

  async function generate() {
    if (!vibe || !groupSize || !budgetTier) return;

    setGenerating(true);
    setError(null);
    setConcepts(null);

    const payload: IdeateRequest = {
      vibe,
      group_size: groupSize,
      budget_tier: budgetTier,
      dates: {
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        season: season || undefined,
        flexible: dateMode === "season" && season === "flexible",
      },
      priorities,
      notes: notes || undefined,
    };

    try {
      const res = await fetch("/api/trips/ai-ideate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to generate trip ideas");
      }

      const data = await res.json();
      setConcepts(data.concepts);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
    setGenerating(false);
  }

  async function chooseConcept(concept: TripConcept) {
    setCreating(concept.concept_name);

    // Build itinerary items from the concept
    const itineraryItems = concept.itinerary.flatMap((day) =>
      day.items.map((item, idx) => ({
        day_number: day.day,
        date: startDate
          ? (() => {
              const d = new Date(startDate + "T12:00:00");
              d.setDate(d.getDate() + day.day - 1);
              return d.toISOString().split("T")[0];
            })()
          : "",
        time: item.time,
        title: item.title,
        type: item.type === "tee_time" ? "golf" : item.type,
        description: "",
        sort_order: (day.day - 1) * 10 + idx,
      }))
    );

    // Calculate dates from concept if not provided
    let tripStart = startDate;
    let tripEnd = endDate;
    if (!tripStart) {
      // Default to 2 months from now
      const d = new Date();
      d.setMonth(d.getMonth() + 2);
      tripStart = d.toISOString().split("T")[0];
    }
    if (!tripEnd && concept.duration_nights) {
      const d = new Date(tripStart + "T12:00:00");
      d.setDate(d.getDate() + concept.duration_nights);
      tripEnd = d.toISOString().split("T")[0];
    }

    try {
      const res = await fetch("/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: concept.concept_name,
          destination: concept.destination,
          startDate: tripStart,
          endDate: tripEnd,
          vibe: vibe,
          budgetTier: budgetTier,
          groupSizeTarget: groupSize,
          notes: `${concept.tagline}\n\nInsider tip: ${concept.insider_tip}`,
          itineraryItems,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to create trip");
      }

      const trip = await res.json();
      router.push(`/trips/${trip.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create trip");
      setCreating(null);
    }
  }

  /* ─── Render answered questions summary ─────────────────── */

  function AnsweredBubble({
    label,
    value,
    editStep,
  }: {
    label: string;
    value: string;
    editStep: number;
  }) {
    return (
      <div className="mb-3 flex items-start gap-3">
        <div className="flex-1">
          <p className="text-xs text-zinc-400">{label}</p>
          <p className="text-sm font-medium text-zinc-700">{value}</p>
        </div>
        {!concepts && !generating && (
          <button
            onClick={() => setStep(editStep)}
            className="text-xs text-emerald-600 hover:text-emerald-700"
          >
            Edit
          </button>
        )}
      </div>
    );
  }

  /* ─── Concept Card ──────────────────────────────────────── */

  function ConceptCard({ concept }: { concept: TripConcept }) {
    const [expanded, setExpanded] = useState(false);
    const roundCount = concept.courses?.length || 0;
    const isCreating = creating === concept.concept_name;

    const badgeConfig: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
      "safe-pick": { label: "Safe Pick", icon: null, color: "bg-blue-100 text-blue-700" },
      "hidden-gem": { label: "Hidden Gem", icon: <Sparkles className="h-3 w-3" />, color: "bg-purple-100 text-purple-700" },
      "dream-trip": { label: "Dream Trip", icon: <Trophy className="h-3 w-3" />, color: "bg-amber-100 text-amber-700" },
    };

    const badge = concept.badge ? badgeConfig[concept.badge] : null;

    return (
      <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
        <div className="p-6">
          {/* Badge + Title */}
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-xl font-bold text-zinc-900">
                {concept.concept_name}
              </h3>
              <div className="mt-1 flex items-center gap-1.5 text-sm text-zinc-500">
                <MapPin className="h-3.5 w-3.5" />
                {concept.destination}
              </div>
            </div>
            {badge && (
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${badge.color}`}
              >
                {badge.icon}
                {badge.label}
              </span>
            )}
          </div>

          {/* Tagline */}
          <p className="mt-3 text-sm text-zinc-600 italic">
            &ldquo;{concept.tagline}&rdquo;
          </p>

          {/* Stats row */}
          <div className="mt-4 flex flex-wrap gap-3">
            <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700">
              <Calendar className="h-3 w-3" />
              {concept.duration_nights} nights
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700">
              <DollarSign className="h-3 w-3" />$
              {concept.estimated_cost_pp?.toLocaleString()}/person
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700">
              <Users className="h-3 w-3" />
              {groupSize} golfers
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
              {roundCount} rounds
            </span>
          </div>

          {/* Courses */}
          <div className="mt-4">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
              Courses
            </h4>
            <div className="mt-2 space-y-1.5">
              {concept.courses?.map((c, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between text-sm"
                >
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-xs font-medium text-emerald-700">
                      {c.day}
                    </span>
                    <span className="text-zinc-700">{c.name}</span>
                  </div>
                  <span className="text-xs text-zinc-400">
                    ${c.estimated_fee}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Highlights */}
          <div className="mt-4">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
              Highlights
            </h4>
            <ul className="mt-2 space-y-1">
              {concept.highlights?.map((h, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-zinc-600">
                  <span className="mt-0.5 text-emerald-500">&#x2022;</span>
                  {h}
                </li>
              ))}
            </ul>
          </div>

          {/* Insider tip */}
          {concept.insider_tip && (
            <div className="mt-4 rounded-lg bg-amber-50 border border-amber-100 p-3">
              <p className="text-xs font-semibold text-amber-700">Insider Tip</p>
              <p className="mt-0.5 text-sm text-amber-600">
                {concept.insider_tip}
              </p>
            </div>
          )}

          {/* Expandable itinerary */}
          {concept.itinerary && concept.itinerary.length > 0 && (
            <div className="mt-4">
              <button
                onClick={() => setExpanded(!expanded)}
                className="flex w-full items-center justify-between rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50"
              >
                See Full Itinerary
                {expanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>
              {expanded && (
                <div className="mt-3 space-y-4">
                  {concept.itinerary.map((day) => (
                    <div key={day.day}>
                      <h5 className="text-sm font-semibold text-zinc-700">
                        Day {day.day}: {day.title}
                      </h5>
                      <div className="mt-1.5 space-y-1">
                        {day.items?.map((item, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between text-xs text-zinc-500"
                          >
                            <div className="flex items-center gap-2">
                              <span className="w-16 text-zinc-400">
                                {item.time}
                              </span>
                              <span
                                className={
                                  item.type === "tee_time"
                                    ? "font-medium text-emerald-600"
                                    : ""
                                }
                              >
                                {item.title}
                              </span>
                            </div>
                            {item.cost_pp > 0 && (
                              <span className="text-zinc-400">
                                ${item.cost_pp}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Choose button */}
        <div className="border-t border-zinc-100 bg-zinc-50 px-6 py-4">
          <button
            onClick={() => chooseConcept(concept)}
            disabled={!!creating}
            className="w-full rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
          >
            {isCreating ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating Trip...
              </span>
            ) : (
              "Choose This Trip"
            )}
          </button>
        </div>
      </div>
    );
  }

  /* ─── Main Render ───────────────────────────────────────── */

  // Show concepts if we have them
  if (concepts) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-zinc-50 px-6 py-10">
        <div className="mx-auto max-w-4xl">
          <button
            onClick={goBack}
            className="inline-flex items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-zinc-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Questions
          </button>

          <div className="mt-6 text-center">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
              Your Trip Concepts
            </h1>
            <p className="mt-2 text-sm text-zinc-500">
              We put together {concepts.length} options based on your
              preferences. Pick your favorite!
            </p>
          </div>

          {/* Answer summary */}
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {vibe && (
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
                {VIBES.find((v) => v.id === vibe)?.emoji}{" "}
                {VIBES.find((v) => v.id === vibe)?.label}
              </span>
            )}
            {groupSize && (
              <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700">
                {groupSize} golfers
              </span>
            )}
            {budgetTier && (
              <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700">
                {BUDGETS.find((b) => b.id === budgetTier)?.label}
              </span>
            )}
          </div>

          {error && (
            <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-center text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {concepts.map((concept, i) => (
              <ConceptCard key={i} concept={concept} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Show generating state
  if (generating) {
    return (
      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-zinc-50">
        <div className="text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center">
            <span className="animate-pulse text-5xl">{"\u26F3"}</span>
          </div>
          <h2 className="text-xl font-bold text-zinc-900">
            Nassau is planning your trip...
          </h2>
          <p className="mt-2 text-sm text-zinc-500">
            Analyzing courses, checking availability, and building your perfect
            itinerary. This takes about 10-15 seconds.
          </p>
          <div className="mt-6">
            <Loader2 className="mx-auto h-6 w-6 animate-spin text-emerald-600" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-zinc-50 px-6 py-10">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <Link
          href="/trips/new"
          className="inline-flex items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-zinc-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>

        <div className="mt-6 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
            Let&apos;s Plan Your Trip
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Question {Math.min(step, totalSteps)} of {totalSteps}
          </p>
        </div>

        {/* Previous answers */}
        <div className="mt-6 space-y-0">
          {step > 1 && vibe && (
            <AnsweredBubble
              label="Trip Vibe"
              value={`${VIBES.find((v) => v.id === vibe)?.emoji} ${VIBES.find((v) => v.id === vibe)?.label}`}
              editStep={1}
            />
          )}
          {step > 2 && groupSize && (
            <AnsweredBubble
              label="Group Size"
              value={`${groupSize} golfers`}
              editStep={2}
            />
          )}
          {step > 3 && budgetTier && (
            <AnsweredBubble
              label="Budget"
              value={`${BUDGETS.find((b) => b.id === budgetTier)?.label} — ${BUDGETS.find((b) => b.id === budgetTier)?.desc}`}
              editStep={3}
            />
          )}
          {step > 4 && (dateMode === "exact" || season) && (
            <AnsweredBubble
              label="When"
              value={
                dateMode === "exact"
                  ? `${startDate} to ${endDate}`
                  : SEASONS.find((s) => s.id === season)?.label || "Flexible"
              }
              editStep={4}
            />
          )}
          {step > 5 && priorities.length > 0 && (
            <AnsweredBubble
              label="Priorities"
              value={priorities
                .map(
                  (p) =>
                    `${PRIORITIES.find((pr) => pr.id === p)?.emoji} ${p}`
                )
                .join(", ")}
              editStep={5}
            />
          )}
        </div>

        {/* Error display */}
        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
            <button
              onClick={generate}
              className="mt-2 block text-sm font-semibold text-red-700 underline hover:text-red-800"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Active question */}
        <div className="mt-6">
          {/* Q1: Vibe */}
          {step === 1 && (
            <div>
              <h2 className="text-lg font-semibold text-zinc-800">
                What kind of trip are you looking for?
              </h2>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {VIBES.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => selectVibe(v.id)}
                    className={`rounded-xl border-2 p-4 text-left transition-all hover:border-emerald-300 hover:shadow-md ${
                      vibe === v.id
                        ? "border-emerald-500 bg-emerald-50"
                        : "border-zinc-200 bg-white"
                    }`}
                  >
                    <span className="text-2xl">{v.emoji}</span>
                    <p className="mt-1 text-sm font-semibold text-zinc-800">
                      {v.label}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Q2: Group Size */}
          {step === 2 && (
            <div>
              <h2 className="text-lg font-semibold text-zinc-800">
                How many golfers are we talking?
              </h2>
              <div className="mt-4 flex flex-wrap gap-3">
                {GROUP_SIZES.map((n) => (
                  <button
                    key={n}
                    onClick={() => selectGroupSize(n)}
                    className={`rounded-full px-6 py-3 text-sm font-semibold transition-all hover:border-emerald-300 hover:shadow-md ${
                      groupSize === n
                        ? "border-2 border-emerald-500 bg-emerald-50 text-emerald-700"
                        : "border-2 border-zinc-200 bg-white text-zinc-700"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setStep(1)}
                className="mt-6 text-sm text-zinc-400 hover:text-zinc-600"
              >
                &larr; Back
              </button>
            </div>
          )}

          {/* Q3: Budget */}
          {step === 3 && (
            <div>
              <h2 className="text-lg font-semibold text-zinc-800">
                What&apos;s everyone comfortable spending per person per day?
              </h2>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {BUDGETS.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => selectBudget(b.id)}
                    className={`rounded-xl border-2 p-4 text-left transition-all hover:border-emerald-300 hover:shadow-md ${
                      budgetTier === b.id
                        ? "border-emerald-500 bg-emerald-50"
                        : "border-zinc-200 bg-white"
                    }`}
                  >
                    <span className="text-lg font-bold text-emerald-600">
                      {b.icon}
                    </span>
                    <p className="mt-1 text-sm font-semibold text-zinc-800">
                      {b.label}
                    </p>
                    <p className="text-xs text-zinc-500">{b.desc}</p>
                  </button>
                ))}
              </div>
              <button
                onClick={() => setStep(2)}
                className="mt-6 text-sm text-zinc-400 hover:text-zinc-600"
              >
                &larr; Back
              </button>
            </div>
          )}

          {/* Q4: When */}
          {step === 4 && (
            <div>
              <h2 className="text-lg font-semibold text-zinc-800">
                When are you thinking?
              </h2>

              {/* Season pills */}
              <div className="mt-4 flex flex-wrap gap-2">
                {SEASONS.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => selectSeason(s.id)}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                      season === s.id
                        ? "border-2 border-emerald-500 bg-emerald-50 text-emerald-700"
                        : "border-2 border-zinc-200 bg-white text-zinc-600 hover:border-emerald-300"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              <div className="my-4 flex items-center gap-3">
                <hr className="flex-1 border-zinc-200" />
                <span className="text-xs text-zinc-400">or pick exact dates</span>
                <hr className="flex-1 border-zinc-200" />
              </div>

              {/* Exact dates */}
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-xs text-zinc-500">Start</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-zinc-500">End</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>
              {startDate && endDate && (
                <button
                  onClick={confirmDates}
                  className="mt-4 w-full rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
                >
                  Continue with these dates
                </button>
              )}

              <button
                onClick={() => setStep(3)}
                className="mt-6 text-sm text-zinc-400 hover:text-zinc-600"
              >
                &larr; Back
              </button>
            </div>
          )}

          {/* Q5: Priorities */}
          {step === 5 && (
            <div>
              <h2 className="text-lg font-semibold text-zinc-800">
                What matters most? Pick up to 3.
              </h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {PRIORITIES.map((p) => {
                  const selected = priorities.includes(p.id);
                  const maxed = priorities.length >= 3 && !selected;
                  return (
                    <button
                      key={p.id}
                      onClick={() => togglePriority(p.id)}
                      disabled={maxed}
                      className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                        selected
                          ? "border-2 border-emerald-500 bg-emerald-50 text-emerald-700"
                          : maxed
                            ? "border-2 border-zinc-100 bg-zinc-50 text-zinc-300 cursor-not-allowed"
                            : "border-2 border-zinc-200 bg-white text-zinc-600 hover:border-emerald-300"
                      }`}
                    >
                      {p.emoji} {p.id}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={confirmPriorities}
                disabled={priorities.length === 0}
                className="mt-6 w-full rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                Continue
              </button>
              <button
                onClick={() => setStep(4)}
                className="mt-3 w-full text-sm text-zinc-400 hover:text-zinc-600"
              >
                &larr; Back
              </button>
            </div>
          )}

          {/* Q6: Notes + Generate */}
          {step === 6 && (
            <div>
              <h2 className="text-lg font-semibold text-zinc-800">
                Anything else I should know?
              </h2>
              <p className="mt-1 text-sm text-zinc-500">
                Previous destinations, must-play courses, group quirks... (optional)
              </p>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="We played Scottsdale last year, so looking for something new. One guy in the group can't walk 18..."
                rows={4}
                className="mt-3 w-full rounded-lg border border-zinc-300 px-4 py-3 text-sm placeholder:text-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <button
                onClick={generate}
                className="mt-6 w-full rounded-xl bg-emerald-600 py-3.5 text-base font-bold text-white shadow-lg transition-all hover:bg-emerald-700 hover:shadow-xl"
              >
                Generate Trip Ideas
              </button>
              <button
                onClick={() => setStep(5)}
                className="mt-3 w-full text-sm text-zinc-400 hover:text-zinc-600"
              >
                &larr; Back
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
