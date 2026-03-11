"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  DollarSign,
  Calendar,
  Loader2,
  MapPin,
  Users,
} from "lucide-react";

/* ─── Types ───────────────────────────────────────────────── */

interface Preferences {
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

interface Concept {
  id: string;
  concept_name: string;
  destination: string;
  destination_id: string;
  tagline: string;
  estimated_cost_pp: number;
  duration_nights: number;
  top_courses: string[];
  highlights: string[];
  insider_tip: string;
  badge: string;
}

interface FollowupOption {
  value: string;
  label: string;
  detail: string;
}

interface FollowupQuestion {
  id: string;
  question: string;
  type: string;
  options: FollowupOption[];
}

interface BuiltTrip {
  concept_name: string;
  destination: string;
  destination_id: string;
  tagline: string;
  duration_nights: number;
  estimated_cost_pp: number;
  cost_breakdown: { golf: number; lodging: number; food: number; transport: number; other: number };
  lodging: { name: string; type: string; per_night: number; why: string };
  courses: { name: string; day: number; time: string; estimated_fee: number; why: string; cart_included?: boolean }[];
  itinerary: { day: number; title: string; items: { time: string; title: string; type: string; cost_pp: number }[] }[];
  insider_tips: string[];
}

type FlowStage = "questions" | "loading_concepts" | "concepts" | "loading_followup" | "followup" | "loading_build" | "built";

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

const BADGE_CONFIG: Record<string, { label: string; color: string; emoji: string }> = {
  safe_pick: { label: "Safe Pick", color: "bg-blue-100 text-blue-700", emoji: "\uD83C\uDFAF" },
  hidden_gem: { label: "Hidden Gem", color: "bg-purple-100 text-purple-700", emoji: "\u2728" },
  dream_trip: { label: "Dream Trip", color: "bg-amber-100 text-amber-700", emoji: "\uD83C\uDFC6" },
};

/* ─── Helpers ─────────────────────────────────────────────── */

async function apiFetch(body: unknown, timeoutMs = 60000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch("/api/trips/ai-ideate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || "Request failed");
    }
    return await res.json();
  } catch (err) {
    clearTimeout(timeout);
    throw err;
  }
}

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
  const [questionStep, setQuestionStep] = useState(1);

  // Flow state
  const [stage, setStage] = useState<FlowStage>("questions");
  const [error, setError] = useState<string | null>(null);

  // Stage 1
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [selectedConceptIds, setSelectedConceptIds] = useState<Set<string>>(new Set());

  // Stage 2
  const [introMessage, setIntroMessage] = useState("");
  const [followupQuestions, setFollowupQuestions] = useState<FollowupQuestion[]>([]);
  const [followupAnswers, setFollowupAnswers] = useState<Record<string, string>>({});

  // Stage 3
  const [finalTrip, setFinalTrip] = useState<BuiltTrip | null>(null);
  const [creating, setCreating] = useState(false);

  /* ─── Build preferences object ──────────────────────────── */

  function getPreferences(): Preferences {
    return {
      vibe: vibe!,
      group_size: groupSize!,
      budget_tier: budgetTier!,
      dates: {
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        season: season || undefined,
        flexible: dateMode === "season" && season === "flexible",
      },
      priorities,
      notes: notes || undefined,
    };
  }

  /* ─── Question Handlers ─────────────────────────────────── */

  function selectVibe(v: string) { setVibe(v); setQuestionStep(2); }
  function selectGroupSize(n: number) { setGroupSize(n); setQuestionStep(3); }
  function selectBudget(b: string) { setBudgetTier(b); setQuestionStep(4); }
  function selectSeason(s: string) {
    setSeason(s); setDateMode("season");
    if (s === "flexible") { setStartDate(""); setEndDate(""); }
    setQuestionStep(5);
  }
  function confirmDates() { if (startDate && endDate) { setDateMode("exact"); setQuestionStep(5); } }
  function togglePriority(p: string) {
    setPriorities((prev) => {
      if (prev.includes(p)) return prev.filter((x) => x !== p);
      if (prev.length >= 3) return prev;
      return [...prev, p];
    });
  }

  /* ─── Stage 1: Generate Concepts ────────────────────────── */

  async function generateConcepts() {
    if (!vibe || !groupSize || !budgetTier) return;
    setStage("loading_concepts");
    setError(null);
    try {
      const data = await apiFetch({ stage: "concepts", preferences: getPreferences() });
      setConcepts(data.concepts || []);
      setSelectedConceptIds(new Set());
      setStage("concepts");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStage("questions");
      setQuestionStep(6);
    }
  }

  function toggleConceptSelection(id: string) {
    setSelectedConceptIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < 2) next.add(id);
      return next;
    });
  }

  /* ─── Stage 2: Get Follow-up Questions ──────────────────── */

  async function requestFollowup() {
    const selected = concepts.filter((c) => selectedConceptIds.has(c.id));
    if (selected.length === 0) return;
    setStage("loading_followup");
    setError(null);
    try {
      const data = await apiFetch({
        stage: "followup",
        original_preferences: getPreferences(),
        selected_concepts: selected.map((c) => ({
          id: c.id,
          concept_name: c.concept_name,
          destination: c.destination,
          destination_id: c.destination_id,
        })),
      });
      setIntroMessage(data.intro_message || "");
      setFollowupQuestions(data.questions || []);
      setFollowupAnswers({});
      setStage("followup");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStage("concepts");
    }
  }

  /* ─── Stage 3: Build Full Trip ──────────────────────────── */

  async function buildTrip() {
    const primary = concepts.find((c) => selectedConceptIds.has(c.id));
    if (!primary) return;
    setStage("loading_build");
    setError(null);
    try {
      const data = await apiFetch({
        stage: "build",
        original_preferences: getPreferences(),
        selected_concept: {
          concept_name: primary.concept_name,
          destination: primary.destination,
          destination_id: primary.destination_id,
        },
        followup_answers: followupAnswers,
      });
      setFinalTrip(data.trip || null);
      setStage("built");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStage("followup");
    }
  }

  /* ─── Choose This Trip ──────────────────────────────────── */

  async function chooseTrip() {
    if (!finalTrip) return;
    setCreating(true);
    setError(null);

    // Calculate trip dates
    let tripStart = startDate;
    let tripEnd = endDate;
    if (!tripStart) {
      const d = new Date();
      d.setMonth(d.getMonth() + 2);
      tripStart = d.toISOString().split("T")[0];
    }
    if (!tripEnd && finalTrip.duration_nights) {
      const d = new Date(tripStart + "T12:00:00");
      d.setDate(d.getDate() + finalTrip.duration_nights);
      tripEnd = d.toISOString().split("T")[0];
    }

    // Map AI type values to DB schedule types
    function mapType(aiType: string): string {
      switch (aiType) {
        case "tee_time": return "tee_time";
        case "food": return "dinner";
        case "activity": return "activity";
        case "travel": return "travel";
        default: return "other";
      }
    }

    // Build itinerary items with cost + booking status
    const itineraryItems = (finalTrip.itinerary || []).flatMap((day) =>
      (day.items || []).map((item, idx) => {
        let dateStr = "";
        if (tripStart) {
          const d = new Date(tripStart + "T12:00:00");
          d.setDate(d.getDate() + day.day - 1);
          dateStr = d.toISOString().split("T")[0];
        }
        // Build description from course info if available
        const course = finalTrip.courses?.find(
          (c) => c.name === item.title || item.title.includes(c.name)
        );
        const desc = course?.why || "";

        return {
          day_number: day.day,
          date: dateStr,
          time: item.time,
          title: item.title,
          type: mapType(item.type),
          description: desc,
          cost: item.cost_pp || 0,
          booking_status: item.type === "tee_time" || item.type === "food" ? "needs_booking" : "",
          sort_order: (day.day - 1) * 10 + idx,
        };
      })
    );

    // Build lodging JSON
    const lodging = finalTrip.lodging ? {
      name: finalTrip.lodging.name,
      address: "",
      checkIn: "",
      checkOut: "",
      confirmationNumber: "",
      phone: "",
      notes: `${finalTrip.lodging.type} \u00B7 $${finalTrip.lodging.per_night}/night\n${finalTrip.lodging.why}`,
    } : undefined;

    try {
      // Create trip with itinerary items
      const res = await fetch("/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: finalTrip.concept_name,
          destination: finalTrip.destination,
          startDate: tripStart,
          endDate: tripEnd,
          vibe,
          budgetTier,
          groupSizeTarget: groupSize,
          notes: `${finalTrip.tagline}\n\nInsider tips:\n${(finalTrip.insider_tips || []).join("\n")}`,
          itineraryItems,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to create trip");
      }
      const trip = await res.json();

      // Save lodging via PATCH if available
      if (lodging) {
        await fetch(`/api/trips/${trip.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lodging }),
        });
      }

      router.push(`/trips/${trip.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create trip");
      setCreating(false);
    }
  }

  function startOver() {
    setStage("questions");
    setQuestionStep(1);
    setVibe(null);
    setGroupSize(null);
    setBudgetTier(null);
    setDateMode(null);
    setStartDate("");
    setEndDate("");
    setSeason(null);
    setPriorities([]);
    setNotes("");
    setConcepts([]);
    setSelectedConceptIds(new Set());
    setFollowupQuestions([]);
    setFollowupAnswers({});
    setFinalTrip(null);
    setError(null);
  }

  /* ─── Loading Screens ───────────────────────────────────── */

  if (stage === "loading_concepts" || stage === "loading_followup" || stage === "loading_build") {
    const loadingMessages: Record<string, { title: string; subtitle: string; time: string }> = {
      loading_concepts: {
        title: "Finding the best destinations for your crew...",
        subtitle: "Scoring courses, checking seasons, and matching your vibe",
        time: "5-10 seconds",
      },
      loading_followup: {
        title: "Preparing some questions to dial in your trip...",
        subtitle: "Analyzing your picks to ask the right questions",
        time: "3-5 seconds",
      },
      loading_build: {
        title: "Building your perfect itinerary...",
        subtitle: "Booking courses, picking restaurants, and calculating costs",
        time: "15-30 seconds",
      },
    };
    const msg = loadingMessages[stage];

    return (
      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-zinc-50">
        <div className="text-center px-6">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center">
            <span className="animate-pulse text-5xl">{"\u26F3"}</span>
          </div>
          <h2 className="text-xl font-bold text-zinc-900">{msg.title}</h2>
          <p className="mt-2 text-sm text-zinc-500">{msg.subtitle}. This takes about {msg.time}.</p>
          <div className="mt-6">
            <Loader2 className="mx-auto h-6 w-6 animate-spin text-[#D94F2B]" />
          </div>
        </div>
      </div>
    );
  }

  /* ─── Stage 3: Built Trip ───────────────────────────────── */

  if (stage === "built" && finalTrip) {
    const breakdown = finalTrip.cost_breakdown;
    const totalCost = breakdown ? breakdown.golf + breakdown.lodging + breakdown.food + breakdown.transport + breakdown.other : finalTrip.estimated_cost_pp;

    return (
      <div className="min-h-[calc(100vh-64px)] bg-zinc-50 px-6 py-10">
        <div className="mx-auto max-w-3xl">
          <button onClick={() => setStage("followup")} className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-700">
            <ArrowLeft className="h-4 w-4" /> Back to Questions
          </button>

          {/* Trip Header */}
          <div className="mt-6 text-center">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">{finalTrip.concept_name}</h1>
            <div className="mt-1 flex items-center justify-center gap-1.5 text-sm text-zinc-500">
              <MapPin className="h-3.5 w-3.5" /> {finalTrip.destination}
            </div>
            <p className="mt-3 text-sm italic text-zinc-600">&ldquo;{finalTrip.tagline}&rdquo;</p>
          </div>

          {/* Stats */}
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700">
              <Calendar className="h-3 w-3" /> {finalTrip.duration_nights} nights
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700">
              <DollarSign className="h-3 w-3" /> ${finalTrip.estimated_cost_pp?.toLocaleString()}/person
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700">
              <Users className="h-3 w-3" /> {groupSize} golfers
            </span>
          </div>

          {/* Cost Breakdown */}
          {breakdown && totalCost > 0 && (
            <div className="mt-8 rounded-2xl border border-zinc-200 bg-white p-6">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">Cost Breakdown (per person)</h3>
              <div className="mt-4 space-y-3">
                {[
                  { label: "Golf", value: breakdown.golf, color: "bg-[#D94F2B]" },
                  { label: "Lodging", value: breakdown.lodging, color: "bg-blue-500" },
                  { label: "Food", value: breakdown.food, color: "bg-amber-500" },
                  { label: "Transport", value: breakdown.transport, color: "bg-purple-500" },
                  { label: "Other", value: breakdown.other, color: "bg-zinc-400" },
                ].filter(item => item.value > 0).map((item) => (
                  <div key={item.label} className="flex items-center gap-3">
                    <span className="w-20 text-xs text-zinc-500">{item.label}</span>
                    <div className="flex-1 overflow-hidden rounded-full bg-zinc-100 h-3">
                      <div className={`h-full rounded-full ${item.color}`} style={{ width: `${(item.value / totalCost) * 100}%` }} />
                    </div>
                    <span className="w-16 text-right text-xs font-medium text-zinc-700">${item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Lodging */}
          {finalTrip.lodging && (
            <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">Lodging</h3>
              <p className="mt-2 text-sm font-semibold text-zinc-800">{finalTrip.lodging.name}</p>
              <p className="text-xs text-zinc-500">{finalTrip.lodging.type} &middot; ${finalTrip.lodging.per_night}/night</p>
              <p className="mt-1 text-sm text-zinc-600">{finalTrip.lodging.why}</p>
            </div>
          )}

          {/* Courses */}
          {finalTrip.courses?.length > 0 && (
            <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">Courses</h3>
              <div className="mt-3 space-y-3">
                {finalTrip.courses.map((c, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-[#D94F2B]">
                      D{c.day}
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-zinc-800">{c.name}</span>
                        <span className="text-xs font-medium text-zinc-500">${c.estimated_fee}</span>
                      </div>
                      <p className="text-xs text-zinc-500">{c.time} &middot; {c.why}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Day-by-Day Itinerary */}
          {finalTrip.itinerary?.length > 0 && (
            <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">Day-by-Day Itinerary</h3>
              <div className="mt-4 space-y-6">
                {finalTrip.itinerary.map((day) => (
                  <div key={day.day}>
                    <h4 className="text-sm font-bold text-zinc-800">Day {day.day}: {day.title}</h4>
                    <div className="mt-2 space-y-1.5">
                      {day.items?.map((item, i) => (
                        <div key={i} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="w-16 text-zinc-400">{item.time}</span>
                            <span className={item.type === "tee_time" ? "font-medium text-[#D94F2B]" : "text-zinc-600"}>
                              {item.title}
                            </span>
                          </div>
                          {item.cost_pp > 0 && <span className="text-zinc-400">${item.cost_pp}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Insider Tips */}
          {finalTrip.insider_tips?.length > 0 && (
            <div className="mt-6 rounded-xl bg-amber-50 border border-amber-100 p-5">
              <h3 className="text-sm font-semibold text-amber-700">Insider Tips</h3>
              <ul className="mt-2 space-y-2">
                {finalTrip.insider_tips.map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-amber-600">
                    <span className="mt-0.5">&bull;</span> {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {error && (
            <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-center text-sm text-red-700">{error}</div>
          )}

          {/* Action Buttons */}
          <div className="mt-8 flex gap-3">
            <button
              onClick={startOver}
              className="flex-1 rounded-lg border-2 border-zinc-200 py-3 text-sm font-semibold text-zinc-600 hover:bg-zinc-50"
            >
              Start Over
            </button>
            <button
              onClick={chooseTrip}
              disabled={creating}
              className="flex-1 rounded-lg bg-[#D94F2B] py-3 text-sm font-bold text-white shadow-lg hover:bg-[#B83D25] disabled:opacity-50"
            >
              {creating ? (
                <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Creating Trip...</span>
              ) : (
                "Choose This Trip"
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ─── Stage 2: Follow-up Questions ──────────────────────── */

  if (stage === "followup") {
    const allAnswered = followupQuestions.length > 0 && followupQuestions.every((q) => followupAnswers[q.id]);

    return (
      <div className="min-h-[calc(100vh-64px)] bg-zinc-50 px-6 py-10">
        <div className="mx-auto max-w-2xl">
          <button onClick={() => setStage("concepts")} className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-700">
            <ArrowLeft className="h-4 w-4" /> Back to Concepts
          </button>

          {/* Intro message */}
          {introMessage && (
            <div className="mt-6 rounded-2xl bg-emerald-50 border border-emerald-100 p-5">
              <p className="text-sm text-[#1A1A1A]">{introMessage}</p>
            </div>
          )}

          {/* Questions */}
          <div className="mt-6 space-y-6">
            {followupQuestions.map((q) => (
              <div key={q.id} className="rounded-2xl border border-zinc-200 bg-white p-6">
                <h3 className="text-sm font-semibold text-zinc-800">{q.question}</h3>
                <div className="mt-3 space-y-2">
                  {q.options.map((opt) => {
                    const selected = followupAnswers[q.id] === opt.value;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => setFollowupAnswers((prev) => ({ ...prev, [q.id]: opt.value }))}
                        className={`w-full rounded-xl border-2 p-4 text-left transition-all ${
                          selected ? "border-[#D94F2B] bg-emerald-50" : "border-zinc-200 hover:border-[#D94F2B]/40"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-zinc-800">{opt.label}</span>
                          {selected && <Check className="h-4 w-4 text-[#D94F2B]" />}
                        </div>
                        {opt.detail && <p className="mt-1 text-xs text-zinc-500">{opt.detail}</p>}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {error && (
            <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-center text-sm text-red-700">{error}</div>
          )}

          <button
            onClick={buildTrip}
            disabled={!allAnswered}
            className="mt-8 w-full rounded-xl bg-[#D94F2B] py-3.5 text-base font-bold text-white shadow-lg hover:bg-[#B83D25] disabled:opacity-50"
          >
            Build My Trip &rarr;
          </button>
        </div>
      </div>
    );
  }

  /* ─── Stage 1: Concept Cards ────────────────────────────── */

  if (stage === "concepts") {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-zinc-50 px-6 py-10">
        <div className="mx-auto max-w-4xl">
          <button onClick={() => { setStage("questions"); setQuestionStep(6); }} className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-700">
            <ArrowLeft className="h-4 w-4" /> Back to Questions
          </button>

          <div className="mt-6 text-center">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Your Trip Concepts</h1>
            <p className="mt-2 text-sm text-zinc-500">Pick 1 or 2 that you like, then we&apos;ll dial it in.</p>
          </div>

          {/* Preference pills */}
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {vibe && (
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-[#D94F2B]">
                {VIBES.find((v) => v.id === vibe)?.emoji} {VIBES.find((v) => v.id === vibe)?.label}
              </span>
            )}
            {groupSize && <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700">{groupSize} golfers</span>}
            {budgetTier && <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700">{BUDGETS.find((b) => b.id === budgetTier)?.label}</span>}
          </div>

          {error && (
            <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-center text-sm text-red-700">{error}</div>
          )}

          {/* Concept Cards */}
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {concepts.map((concept) => {
              const isSelected = selectedConceptIds.has(concept.id);
              const badge = BADGE_CONFIG[concept.badge];

              return (
                <div
                  key={concept.id}
                  className={`rounded-2xl border-2 bg-white shadow-sm overflow-hidden transition-all ${
                    isSelected ? "border-[#D94F2B] ring-2 ring-emerald-200" : "border-zinc-200"
                  }`}
                >
                  <div className="p-5">
                    {/* Badge */}
                    {badge && (
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${badge.color}`}>
                        {badge.emoji} {badge.label}
                      </span>
                    )}

                    {/* Name + Destination */}
                    <h3 className="mt-3 text-lg font-bold text-zinc-900">{concept.concept_name}</h3>
                    <div className="mt-1 flex items-center gap-1 text-sm text-zinc-500">
                      <MapPin className="h-3.5 w-3.5" /> {concept.destination}
                    </div>

                    {/* Tagline */}
                    <p className="mt-3 text-sm italic text-zinc-600">&ldquo;{concept.tagline}&rdquo;</p>

                    {/* Stats */}
                    <div className="mt-3 flex gap-2">
                      <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-600">
                        {concept.duration_nights} nights
                      </span>
                      <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-600">
                        ${concept.estimated_cost_pp?.toLocaleString()}/pp
                      </span>
                    </div>

                    {/* Courses */}
                    {concept.top_courses?.length > 0 && (
                      <div className="mt-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Courses</p>
                        <ul className="mt-1.5 space-y-1">
                          {concept.top_courses.map((name, i) => (
                            <li key={i} className="flex items-center gap-2 text-sm text-zinc-700">
                              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-bold text-[#D94F2B]">{i + 1}</span>
                              {name}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Highlights */}
                    {concept.highlights?.length > 0 && (
                      <div className="mt-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Highlights</p>
                        <ul className="mt-1.5 space-y-1">
                          {concept.highlights.map((h, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs text-zinc-600">
                              <span className="mt-0.5 text-[#D94F2B]">&bull;</span> {h}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Insider Tip */}
                    {concept.insider_tip && (
                      <div className="mt-4 rounded-lg bg-amber-50 border border-amber-100 p-3">
                        <p className="text-[10px] font-semibold uppercase text-amber-700">Insider Tip</p>
                        <p className="mt-0.5 text-xs text-amber-600">{concept.insider_tip}</p>
                      </div>
                    )}
                  </div>

                  {/* Select button */}
                  <div className="border-t border-zinc-100 bg-zinc-50 px-5 py-3">
                    <button
                      onClick={() => toggleConceptSelection(concept.id)}
                      className={`w-full rounded-lg py-2 text-sm font-semibold transition-colors ${
                        isSelected
                          ? "bg-[#D94F2B] text-white"
                          : "border border-zinc-300 bg-white text-zinc-700 hover:border-[#D94F2B]/40 hover:text-[#D94F2B]"
                      }`}
                    >
                      {isSelected ? (
                        <span className="inline-flex items-center gap-1.5"><Check className="h-4 w-4" /> Selected</span>
                      ) : (
                        "I Like This One"
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Tell Me More button */}
          <div className="mt-8 text-center">
            <button
              onClick={requestFollowup}
              disabled={selectedConceptIds.size === 0}
              className="rounded-xl bg-[#D94F2B] px-8 py-3.5 text-base font-bold text-white shadow-lg transition-all hover:bg-[#B83D25] disabled:opacity-50"
            >
              Tell Me More &rarr;
            </button>
            {selectedConceptIds.size === 0 && (
              <p className="mt-2 text-xs text-zinc-400">Select at least 1 concept to continue</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ─── Questions Flow ────────────────────────────────────── */

  return (
    <div className="min-h-[calc(100vh-64px)] bg-zinc-50 px-6 py-10">
      <div className="mx-auto max-w-2xl">
        <Link href="/trips/new" className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-700">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>

        <div className="mt-6 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Let&apos;s Plan Your Trip</h1>
          <p className="mt-1 text-sm text-zinc-500">Question {Math.min(questionStep, 6)} of 6</p>
        </div>

        {/* Previous answers */}
        <div className="mt-6 space-y-0">
          {questionStep > 1 && vibe && (
            <AnsweredBubble label="Trip Vibe" value={`${VIBES.find((v) => v.id === vibe)?.emoji} ${VIBES.find((v) => v.id === vibe)?.label}`} onEdit={() => setQuestionStep(1)} />
          )}
          {questionStep > 2 && groupSize && (
            <AnsweredBubble label="Group Size" value={`${groupSize} golfers`} onEdit={() => setQuestionStep(2)} />
          )}
          {questionStep > 3 && budgetTier && (
            <AnsweredBubble label="Budget" value={`${BUDGETS.find((b) => b.id === budgetTier)?.label} \u2014 ${BUDGETS.find((b) => b.id === budgetTier)?.desc}`} onEdit={() => setQuestionStep(3)} />
          )}
          {questionStep > 4 && (dateMode === "exact" || season) && (
            <AnsweredBubble label="When" value={dateMode === "exact" ? `${startDate} to ${endDate}` : SEASONS.find((s) => s.id === season)?.label || "Flexible"} onEdit={() => setQuestionStep(4)} />
          )}
          {questionStep > 5 && priorities.length > 0 && (
            <AnsweredBubble label="Priorities" value={priorities.map((p) => `${PRIORITIES.find((pr) => pr.id === p)?.emoji} ${p}`).join(", ")} onEdit={() => setQuestionStep(5)} />
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
            <button onClick={generateConcepts} className="mt-2 block text-sm font-semibold text-red-700 underline hover:text-red-800">Try Again</button>
          </div>
        )}

        {/* Active question */}
        <div className="mt-6">
          {questionStep === 1 && (
            <div>
              <h2 className="text-lg font-semibold text-zinc-800">What kind of trip are you looking for?</h2>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {VIBES.map((v) => (
                  <button key={v.id} onClick={() => selectVibe(v.id)}
                    className={`rounded-xl border-2 p-4 text-left transition-all hover:border-[#D94F2B]/40 hover:shadow-md ${vibe === v.id ? "border-[#D94F2B] bg-emerald-50" : "border-zinc-200 bg-white"}`}>
                    <span className="text-2xl">{v.emoji}</span>
                    <p className="mt-1 text-sm font-semibold text-zinc-800">{v.label}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {questionStep === 2 && (
            <div>
              <h2 className="text-lg font-semibold text-zinc-800">How many golfers are we talking?</h2>
              <div className="mt-4 flex flex-wrap gap-3">
                {GROUP_SIZES.map((n) => (
                  <button key={n} onClick={() => selectGroupSize(n)}
                    className={`rounded-full px-6 py-3 text-sm font-semibold transition-all hover:border-[#D94F2B]/40 hover:shadow-md ${groupSize === n ? "border-2 border-[#D94F2B] bg-emerald-50 text-[#D94F2B]" : "border-2 border-zinc-200 bg-white text-zinc-700"}`}>
                    {n}
                  </button>
                ))}
              </div>
              <button onClick={() => setQuestionStep(1)} className="mt-6 text-sm text-zinc-400 hover:text-zinc-600">&larr; Back</button>
            </div>
          )}

          {questionStep === 3 && (
            <div>
              <h2 className="text-lg font-semibold text-zinc-800">What&apos;s everyone comfortable spending per person per day?</h2>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {BUDGETS.map((b) => (
                  <button key={b.id} onClick={() => selectBudget(b.id)}
                    className={`rounded-xl border-2 p-4 text-left transition-all hover:border-[#D94F2B]/40 hover:shadow-md ${budgetTier === b.id ? "border-[#D94F2B] bg-emerald-50" : "border-zinc-200 bg-white"}`}>
                    <span className="text-lg font-bold text-[#D94F2B]">{b.icon}</span>
                    <p className="mt-1 text-sm font-semibold text-zinc-800">{b.label}</p>
                    <p className="text-xs text-zinc-500">{b.desc}</p>
                  </button>
                ))}
              </div>
              <button onClick={() => setQuestionStep(2)} className="mt-6 text-sm text-zinc-400 hover:text-zinc-600">&larr; Back</button>
            </div>
          )}

          {questionStep === 4 && (
            <div>
              <h2 className="text-lg font-semibold text-zinc-800">When are you thinking?</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {SEASONS.map((s) => (
                  <button key={s.id} onClick={() => selectSeason(s.id)}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${season === s.id ? "border-2 border-[#D94F2B] bg-emerald-50 text-[#D94F2B]" : "border-2 border-zinc-200 bg-white text-zinc-600 hover:border-[#D94F2B]/40"}`}>
                    {s.label}
                  </button>
                ))}
              </div>
              <div className="my-4 flex items-center gap-3">
                <hr className="flex-1 border-zinc-200" />
                <span className="text-xs text-zinc-400">or pick exact dates</span>
                <hr className="flex-1 border-zinc-200" />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-xs text-zinc-500">Start</label>
                  <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-zinc-500">End</label>
                  <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
                </div>
              </div>
              {startDate && endDate && (
                <button onClick={confirmDates} className="mt-4 w-full rounded-lg bg-[#D94F2B] py-2.5 text-sm font-semibold text-white hover:bg-[#B83D25]">Continue with these dates</button>
              )}
              <button onClick={() => setQuestionStep(3)} className="mt-6 text-sm text-zinc-400 hover:text-zinc-600">&larr; Back</button>
            </div>
          )}

          {questionStep === 5 && (
            <div>
              <h2 className="text-lg font-semibold text-zinc-800">What matters most? Pick up to 3.</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {PRIORITIES.map((p) => {
                  const selected = priorities.includes(p.id);
                  const maxed = priorities.length >= 3 && !selected;
                  return (
                    <button key={p.id} onClick={() => togglePriority(p.id)} disabled={maxed}
                      className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${selected ? "border-2 border-[#D94F2B] bg-emerald-50 text-[#D94F2B]" : maxed ? "border-2 border-zinc-100 bg-zinc-50 text-zinc-300 cursor-not-allowed" : "border-2 border-zinc-200 bg-white text-zinc-600 hover:border-[#D94F2B]/40"}`}>
                      {p.emoji} {p.id}
                    </button>
                  );
                })}
              </div>
              <button onClick={() => setQuestionStep(6)} disabled={priorities.length === 0} className="mt-6 w-full rounded-lg bg-[#D94F2B] py-2.5 text-sm font-semibold text-white hover:bg-[#B83D25] disabled:opacity-50">Continue</button>
              <button onClick={() => setQuestionStep(4)} className="mt-3 w-full text-sm text-zinc-400 hover:text-zinc-600">&larr; Back</button>
            </div>
          )}

          {questionStep === 6 && (
            <div>
              <h2 className="text-lg font-semibold text-zinc-800">Anything else I should know?</h2>
              <p className="mt-1 text-sm text-zinc-500">Previous destinations, must-play courses, group quirks... (optional)</p>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
                placeholder="We played Scottsdale last year, so looking for something new. One guy in the group can't walk 18..."
                rows={4} className="mt-3 w-full rounded-lg border border-zinc-300 px-4 py-3 text-sm placeholder:text-zinc-400 focus:border-[#D94F2B] focus:outline-none focus:ring-1 focus:ring-[#D94F2B]" />
              <button onClick={generateConcepts} className="mt-6 w-full rounded-xl bg-[#D94F2B] py-3.5 text-base font-bold text-white shadow-lg transition-all hover:bg-[#B83D25] hover:shadow-xl">
                Find My Trip &rarr;
              </button>
              <button onClick={() => setQuestionStep(5)} className="mt-3 w-full text-sm text-zinc-400 hover:text-zinc-600">&larr; Back</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Sub-components ──────────────────────────────────────── */

function AnsweredBubble({ label, value, onEdit }: { label: string; value: string; onEdit: () => void }) {
  return (
    <div className="mb-3 flex items-start gap-3">
      <div className="flex-1">
        <p className="text-xs text-zinc-400">{label}</p>
        <p className="text-sm font-medium text-zinc-700">{value}</p>
      </div>
      <button onClick={onEdit} className="text-xs text-[#D94F2B] hover:text-[#D94F2B]">Edit</button>
    </div>
  );
}
