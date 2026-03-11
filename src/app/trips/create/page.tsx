"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Check,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { generateTripName } from "@/lib/trip-name-generator";
import knowledgeBase from "@/data/nassau-knowledge-base.json";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

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

const BUDGETS = [
  { id: "budget", label: "Budget", subtitle: "Under $150/day" },
  { id: "mid-range", label: "Mid-Range", subtitle: "$150\u2013350/day" },
  { id: "premium", label: "Premium", subtitle: "$350\u2013600/day" },
  { id: "luxury", label: "Luxury", subtitle: "$600+/day" },
];

const BUDGET_INDEX: Record<string, number> = {
  budget: 0,
  "mid-range": 1,
  premium: 2,
  luxury: 3,
};

const NOTE_CHIPS = [
  "\uD83C\uDF7A Bring your own beer money",
  "\uD83C\uDF05 Early tee times preferred",
  "\uD83C\uDFE0 Looking at rental houses",
  "\uD83C\uDFB0 Non-golf activities welcome",
  "\uD83D\uDCB0 Keep it affordable",
  "\uD83C\uDFCC\uFE0F Walking preferred",
  "\uD83D\uDED2 Cart included courses only",
  "\uD83D\uDC54 No dress code courses",
];

const POPULAR_DESTINATIONS = [
  "Scottsdale, AZ",
  "Myrtle Beach, SC",
  "Pinehurst, NC",
  "Las Vegas, NV",
  "Hilton Head Island, SC",
];

const DATE_PILLS = [
  { id: "this-weekend", label: "This Weekend" },
  { id: "next-weekend", label: "Next Weekend" },
  { id: "march", label: "March" },
  { id: "april", label: "April" },
  { id: "spring-2026", label: "Spring 2026" },
  { id: "summer-2026", label: "Summer 2026" },
  { id: "flexible", label: "I\u2019m Flexible" },
];

// ---------------------------------------------------------------------------
// Knowledge-base destination extraction (module scope — runs once)
// ---------------------------------------------------------------------------

interface KBDest {
  id: string;
  name: string;
  region: string;
  price_tier: string;
  courses: number;
  best_months: string[];
  nearest_airport: string;
}

const KB_DESTINATIONS: KBDest[] = (
  knowledgeBase as { destinations: Array<Record<string, unknown>> }
).destinations.map((d) => ({
  id: d.id as string,
  name: d.destination as string,
  region: d.region as string,
  price_tier: d.price_tier as string,
  courses: (d.top_courses as unknown[])?.length ?? 0,
  best_months: (d.best_months as string[]) ?? [],
  nearest_airport: (d.nearest_airport as string) ?? "",
}));

interface PlacesPrediction {
  description: string;
  place_id: string;
  structured_formatting?: {
    main_text: string;
    secondary_text: string;
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function priceTierIndicator(tier: string): string {
  if (tier.includes("luxury")) return "$$$$";
  if (tier.includes("premium")) return "$$$";
  if (tier.includes("mid-high") || tier.includes("high")) return "$$$";
  if (tier.includes("budget-mid")) return "$\u2013$$";
  if (tier.includes("mid")) return "$$";
  if (tier.includes("budget")) return "$";
  return "$$";
}

function groupLabel(size: number): { emoji: string; label: string } {
  if (size <= 4) return { emoji: "\uD83D\uDC65", label: "Buddies Trip" };
  if (size <= 8) return { emoji: "\uD83D\uDC65\uD83D\uDC65", label: "The Crew" };
  if (size <= 12)
    return { emoji: "\uD83D\uDC65\uD83D\uDC65\uD83D\uDC65", label: "The Squad" };
  if (size <= 16)
    return {
      emoji: "\uD83D\uDC65\uD83D\uDC65\uD83D\uDC65\uD83D\uDC65",
      label: "The Army",
    };
  return { emoji: "\uD83C\uDFDF\uFE0F", label: "The Tournament" };
}

function budgetHintForDest(destName: string): string | null {
  const d = KB_DESTINATIONS.find((x) => x.name === destName);
  if (!d) return null;
  const t = d.price_tier;
  let label = "Mid-Range";
  if (t.includes("luxury")) label = "Premium / Luxury";
  else if (t.includes("premium")) label = "Premium";
  else if (t.includes("mid-high")) label = "Mid-Range to Premium";
  else if (t.includes("budget-mid")) label = "Budget to Mid-Range";
  else if (t.includes("budget")) label = "Budget";
  else if (t.includes("mid")) label = "Mid-Range";
  const city = destName.split(",")[0].trim();
  return `\uD83D\uDCA1 Most ${city} trips are ${label}`;
}

function nextFriday(from: Date): Date {
  const d = new Date(from);
  const day = d.getDay();
  const diff = (5 - day + 7) % 7 || 7;
  d.setDate(d.getDate() + diff);
  return d;
}

function fmtDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

function nameSuggestions(vibe: string | null, destination: string): string[] {
  const city = destination.split(",")[0].trim() || "Golf";
  const main = generateTripName(vibe, destination);
  const altsMap: Record<string, string[]> = {
    competitive: [
      `The ${city} Showdown`,
      `${city} Championship`,
      `${city} Classic`,
    ],
    party: [`${city} Sendoff`, `Boys Trip: ${city}`, `${city} Tee Party`],
    relaxed: [
      `${city} Links Getaway`,
      `The ${city} Retreat`,
      `Easy ${city}`,
    ],
    "father-son": [
      `${city} Legacy Trip`,
      `Pops & Putts: ${city}`,
      `${city} Pilgrimage`,
    ],
    corporate: [
      `${city} Team Classic`,
      `${city} Invitational`,
      `${city} Corporate Cup`,
    ],
    "bucket-list": [
      `${city} Dream Trip`,
      `Once in a Lifetime: ${city}`,
      `The ${city} Experience`,
    ],
  };
  const alts = altsMap[vibe ?? ""] ?? [`${city} Golf Trip`, `The ${city} Trip`];
  const out = [main];
  for (const a of alts) {
    if (!out.includes(a)) out.push(a);
    if (out.length >= 4) break;
  }
  return out;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CreateTripWizardPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  // Step 1
  const [vibe, setVibe] = useState<string | null>(null);

  // Step 2
  const [destination, setDestination] = useState("");
  const [destSearch, setDestSearch] = useState("");
  const [destFocused, setDestFocused] = useState(false);
  const [selectedKBDest, setSelectedKBDest] = useState<KBDest | null>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [dateQuickSelect, setDateQuickSelect] = useState<string | null>(null);
  const [flexibleDates, setFlexibleDates] = useState(false);

  // Step 3
  const [groupSize, setGroupSize] = useState(8);
  const [budgetTier, setBudgetTier] = useState("mid-range");

  // Step 4
  const [tripName, setTripName] = useState("");
  const [notes, setNotes] = useState("");
  const [nameGenerated, setNameGenerated] = useState(false);
  const [addedChips, setAddedChips] = useState<Set<string>>(new Set());

  const autoAdvanceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const destInputRef = useRef<HTMLInputElement>(null);
  const destDropdownRef = useRef<HTMLDivElement>(null);

  // ---- Derived ----

  const filteredDests = useMemo(() => {
    if (!destSearch.trim()) return [];
    const q = destSearch.toLowerCase();
    return KB_DESTINATIONS.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.region.toLowerCase().includes(q) ||
        d.id.toLowerCase().includes(q) ||
        d.nearest_airport.toLowerCase().includes(q)
    ).slice(0, 8);
  }, [destSearch]);

  // ---- Google Places autocomplete (debounced, KB-first fallback) ----

  const [placesResults, setPlacesResults] = useState<PlacesPrediction[]>([]);
  const placesAbortRef = useRef<AbortController | null>(null);
  const placesTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Clear previous timer
    if (placesTimerRef.current) clearTimeout(placesTimerRef.current);

    // Don't fetch if search is short or KB already has 3+ matches
    if (destSearch.trim().length < 2 || filteredDests.length >= 3) {
      setPlacesResults([]);
      return;
    }

    // Debounce 300ms
    placesTimerRef.current = setTimeout(() => {
      // Abort any in-flight request
      if (placesAbortRef.current) placesAbortRef.current.abort();
      const controller = new AbortController();
      placesAbortRef.current = controller;

      fetch(
        `/api/places/autocomplete?input=${encodeURIComponent(destSearch.trim())}`,
        { signal: controller.signal }
      )
        .then((res) => res.json())
        .then((data) => {
          if (!controller.signal.aborted) {
            setPlacesResults(data.predictions ?? []);
          }
        })
        .catch(() => {
          // Network error or abort — silently ignore
          if (!controller.signal.aborted) setPlacesResults([]);
        });
    }, 300);

    return () => {
      if (placesTimerRef.current) clearTimeout(placesTimerRef.current);
    };
  }, [destSearch, filteredDests.length]);

  // Compute how many Google Places results to show (max 8 total minus KB results)
  const maxGoogleResults = Math.max(0, 8 - filteredDests.length);
  const googleResults = placesResults.slice(0, maxGoogleResults);
  const hasDropdownResults =
    destSearch.trim().length > 0 &&
    (filteredDests.length > 0 || googleResults.length > 0);

  const names = useMemo(() => {
    if (!destination.trim() || !vibe) return [];
    return nameSuggestions(vibe, destination);
  }, [vibe, destination]);

  const budgetIdx = BUDGET_INDEX[budgetTier] ?? 1;
  const grpLabel = groupLabel(groupSize);
  const bHint = budgetHintForDest(destination);

  function calcDuration() {
    if (!startDate || !endDate) return null;
    const s = new Date(startDate + "T12:00:00");
    const e = new Date(endDate + "T12:00:00");
    const diff = Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24));
    if (diff <= 0) return null;
    return `${diff} night${diff !== 1 ? "s" : ""}, ${diff + 1} day${diff + 1 !== 1 ? "s" : ""}`;
  }
  const duration = calcDuration();

  // ---- Close dropdown on outside click ----
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        destDropdownRef.current &&
        !destDropdownRef.current.contains(e.target as Node) &&
        destInputRef.current &&
        !destInputRef.current.contains(e.target as Node)
      ) {
        setDestFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // ---- Navigation ----

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

  // ---- Step 1 handlers ----

  function handleVibeSelect(id: string) {
    setVibe(id);
    setNameGenerated(false);
    if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current);
    autoAdvanceRef.current = setTimeout(() => setStep(2), 300);
  }

  // ---- Step 2 handlers ----

  function handleDestSelect(d: KBDest) {
    setDestination(d.name);
    setDestSearch(d.name);
    setSelectedKBDest(d);
    setDestFocused(false);
    setNameGenerated(false);
  }

  function handleGooglePlaceSelect(prediction: PlacesPrediction) {
    // Use main_text (city name) if available, strip country for US results
    let display = prediction.description;
    const sf = prediction.structured_formatting;
    if (sf?.main_text && sf?.secondary_text) {
      // Strip ", USA" / ", United States" from the secondary text
      const secondary = sf.secondary_text
        .replace(/,\s*(USA|United States)$/i, "")
        .trim();
      display = secondary ? `${sf.main_text}, ${secondary}` : sf.main_text;
    }
    setDestination(display);
    setDestSearch(display);
    setSelectedKBDest(null);
    setDestFocused(false);
    setNameGenerated(false);
    setPlacesResults([]);
  }

  function handlePopularClick(name: string) {
    const d = KB_DESTINATIONS.find((x) => x.name === name);
    if (d) {
      handleDestSelect(d);
    } else {
      setDestination(name);
      setDestSearch(name);
      setDestFocused(false);
      setNameGenerated(false);
    }
  }

  function handleDatePill(id: string) {
    setDateQuickSelect(id);
    if (id === "flexible") {
      setFlexibleDates(true);
      setStartDate("");
      setEndDate("");
      return;
    }
    setFlexibleDates(false);

    const now = new Date();
    if (id === "this-weekend") {
      const fri = nextFriday(now);
      const sun = new Date(fri);
      sun.setDate(fri.getDate() + 2);
      setStartDate(fmtDate(fri));
      setEndDate(fmtDate(sun));
    } else if (id === "next-weekend") {
      const fri = nextFriday(now);
      const nf = new Date(fri);
      nf.setDate(fri.getDate() + 7);
      const ns = new Date(nf);
      ns.setDate(nf.getDate() + 2);
      setStartDate(fmtDate(nf));
      setEndDate(fmtDate(ns));
    } else if (id === "march") {
      setStartDate("2026-03-01");
      setEndDate("2026-03-31");
    } else if (id === "april") {
      setStartDate("2026-04-01");
      setEndDate("2026-04-30");
    } else if (id === "spring-2026") {
      setStartDate("2026-03-01");
      setEndDate("2026-05-31");
    } else if (id === "summer-2026") {
      setStartDate("2026-06-01");
      setEndDate("2026-08-31");
    }
  }

  // ---- Step 4 handlers ----

  function handleNoteChip(chip: string) {
    if (addedChips.has(chip)) return;
    setNotes((prev) => (prev ? prev + "\n" + chip : chip));
    setAddedChips((prev) => new Set(prev).add(chip));
  }

  // ---- Submit (unchanged logic) ----

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
      setShowSuccess(true);
      setTimeout(() => router.push(`/trips/${trip.id}`), 800);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create trip");
      setSubmitting(false);
    }
  }

  // ---- Budget slider color helpers ----

  const budgetTextColor = [
    "text-[#D94F2B]",
    "text-blue-600",
    "text-purple-600",
    "text-amber-600",
  ][budgetIdx];

  const budgetThumbClass = [
    "[&::-webkit-slider-thumb]:bg-[#D94F2B] [&::-moz-range-thumb]:bg-[#D94F2B] accent-[#D94F2B]",
    "[&::-webkit-slider-thumb]:bg-blue-600 [&::-moz-range-thumb]:bg-blue-600 accent-blue-600",
    "[&::-webkit-slider-thumb]:bg-purple-600 [&::-moz-range-thumb]:bg-purple-600 accent-purple-600",
    "[&::-webkit-slider-thumb]:bg-amber-500 [&::-moz-range-thumb]:bg-amber-500 accent-amber-500",
  ][budgetIdx];

  // ---- Whether we should show the refined date picker vs the manual fallback ----

  const isMonthOrSeasonPill =
    dateQuickSelect &&
    !flexibleDates &&
    dateQuickSelect !== "this-weekend" &&
    dateQuickSelect !== "next-weekend";

  const showManualDates =
    !flexibleDates &&
    (!dateQuickSelect ||
      dateQuickSelect === "this-weekend" ||
      dateQuickSelect === "next-weekend");

  // ===========================================================================
  // Render
  // ===========================================================================

  return (
    <div className="min-h-[calc(100vh-64px)] bg-zinc-50 px-4 sm:px-6 py-8 sm:py-10 pb-28 sm:pb-10">
      <div className="mx-auto max-w-2xl">
        {/* Back link */}
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
              className="h-2 flex-1 rounded-full bg-zinc-200 overflow-hidden"
            >
              <div
                className="h-full rounded-full bg-[#D94F2B] transition-all duration-500 ease-out"
                style={{ width: s <= step ? "100%" : "0%" }}
              />
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs text-zinc-400">Step {step} of 4</p>

        {/* Error banner */}
        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Success overlay */}
        {showSuccess && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="rounded-full bg-[#D94F2B] p-6 animate-bounce">
              <Check className="h-12 w-12 text-white" />
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* STEP 1 — Vibe                                                     */}
        {/* ================================================================= */}
        {step === 1 && (
          <div className="mt-8 animate-[fadeSlideIn_200ms_ease-out]">
            <h2 className="text-2xl font-bold tracking-tight text-zinc-900">
              What&apos;s the vibe?
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              Tap the one that best describes your trip.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {VIBES.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => handleVibeSelect(v.id)}
                  className={`relative rounded-xl border-2 p-5 text-left transition-all duration-200 min-h-[80px] active:scale-[0.97] ${
                    vibe === v.id
                      ? "border-[#D94F2B] bg-emerald-50 shadow-md scale-[1.02]"
                      : "border-zinc-200 bg-white hover:border-zinc-300 hover:shadow-sm"
                  }`}
                >
                  {vibe === v.id && (
                    <div className="absolute top-3 right-3 rounded-full bg-[#D94F2B] p-0.5">
                      <Check className="h-3.5 w-3.5 text-white" />
                    </div>
                  )}
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

        {/* ================================================================= */}
        {/* STEP 2 — Destination & Dates                                      */}
        {/* ================================================================= */}
        {step === 2 && (
          <div className="mt-8 animate-[fadeSlideIn_200ms_ease-out]">
            <h2 className="text-2xl font-bold tracking-tight text-zinc-900">
              Where &amp; when?
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              Pick a destination and rough dates.
            </p>

            <div className="mt-6 space-y-6">
              {/* ---------- Destination search ---------- */}
              <div className="relative">
                <label className="block text-sm font-medium text-zinc-700">
                  Where are you headed? *
                </label>

                <div className="relative mt-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                  <input
                    ref={destInputRef}
                    type="text"
                    value={destSearch}
                    onFocus={() => setDestFocused(true)}
                    onChange={(e) => {
                      setDestSearch(e.target.value);
                      setDestination(e.target.value);
                      setSelectedKBDest(null);
                      setNameGenerated(false);
                      if (!e.target.value) setDestFocused(true);
                    }}
                    placeholder="e.g. Scottsdale, Myrtle Beach..."
                    className="block w-full rounded-lg border border-zinc-300 pl-9 pr-9 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-[#D94F2B] focus:outline-none focus:ring-2 focus:ring-[#D94F2B]/20"
                  />
                  {destSearch && (
                    <button
                      type="button"
                      onClick={() => {
                        setDestSearch("");
                        setDestination("");
                        setSelectedKBDest(null);
                        setPlacesResults([]);
                        destInputRef.current?.focus();
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Dropdown results — KB first, then Google Places */}
                {destFocused && hasDropdownResults && (
                  <div
                    ref={destDropdownRef}
                    className="absolute z-20 mt-1 w-full rounded-lg border border-zinc-200 bg-white shadow-lg max-h-80 overflow-y-auto"
                  >
                    {/* KB results */}
                    {filteredDests.map((d) => (
                      <button
                        key={`kb-${d.id}`}
                        type="button"
                        onClick={() => handleDestSelect(d)}
                        className="w-full px-4 py-3 text-left hover:bg-emerald-50 transition-colors flex items-center justify-between border-b border-zinc-100"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="min-w-0">
                            <span className="text-sm font-medium text-zinc-900">
                              {d.name}
                            </span>
                            <span className="ml-2 text-xs text-zinc-400">
                              {d.region}
                            </span>
                          </div>
                          <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-[#D94F2B]">
                            {"\uD83C\uDFCC\uFE0F"} Nassau Destination
                          </span>
                        </div>
                        <span className="shrink-0 ml-2 text-xs font-medium text-[#D94F2B]">
                          {priceTierIndicator(d.price_tier)}
                        </span>
                      </button>
                    ))}

                    {/* Divider between KB and Google results */}
                    {filteredDests.length > 0 && googleResults.length > 0 && (
                      <div className="border-t border-zinc-200 px-4 py-1.5 bg-zinc-50">
                        <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider">
                          More places
                        </span>
                      </div>
                    )}

                    {/* Google Places results */}
                    {googleResults.map((p) => (
                      <button
                        key={`gp-${p.place_id}`}
                        type="button"
                        onClick={() => handleGooglePlaceSelect(p)}
                        className="w-full px-4 py-3 text-left hover:bg-zinc-50 transition-colors flex items-center gap-2 border-b border-zinc-100 last:border-0"
                      >
                        <span className="shrink-0 text-zinc-400">
                          {"\uD83D\uDCCD"}
                        </span>
                        <div className="min-w-0">
                          <span className="text-sm font-medium text-zinc-900">
                            {p.structured_formatting?.main_text ??
                              p.description}
                          </span>
                          {p.structured_formatting?.secondary_text && (
                            <span className="ml-2 text-xs text-zinc-400">
                              {p.structured_formatting.secondary_text}
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Popular destinations hint */}
                {destFocused && !destSearch && (
                  <div className="mt-2">
                    <span className="text-xs text-zinc-400">
                      Popular destinations:
                    </span>
                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
                      {POPULAR_DESTINATIONS.map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => handlePopularClick(n)}
                          className="text-xs font-medium text-[#D94F2B] hover:text-[#D94F2B] hover:underline transition-colors"
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* KB info badge */}
                {selectedKBDest && (
                  <div className="mt-2 inline-flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-1.5 text-xs text-[#D94F2B]">
                    <span>
                      {"\uD83C\uDFCC\uFE0F"} {selectedKBDest.courses} courses
                    </span>
                    <span>&middot;</span>
                    <span>{priceTierIndicator(selectedKBDest.price_tier)}</span>
                    <span>&middot;</span>
                    <span>
                      Best:{" "}
                      {selectedKBDest.best_months.slice(0, 3).join(", ")}
                      {selectedKBDest.best_months.length > 3 ? "\u2026" : ""}
                    </span>
                  </div>
                )}
              </div>

              {/* ---------- Date quick-select pills ---------- */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  When are you going?
                </label>

                <div className="flex flex-wrap gap-2">
                  {DATE_PILLS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleDatePill(p.id)}
                      className={`rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 active:scale-95 min-h-[44px] ${
                        dateQuickSelect === p.id
                          ? "bg-[#D94F2B] text-white shadow-sm"
                          : "bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50 hover:border-zinc-300"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                {/* Flexible message */}
                {flexibleDates && (
                  <p className="mt-3 text-sm text-zinc-500 italic">
                    No worries &mdash; you can set dates later.
                  </p>
                )}

                {/* Refined picker for month / season pills */}
                {isMonthOrSeasonPill && (
                  <div className="mt-3 rounded-lg bg-zinc-100 p-3">
                    <p className="text-xs text-zinc-500 mb-2">
                      Pick your exact dates
                      {dateQuickSelect === "march" && " in March"}
                      {dateQuickSelect === "april" && " in April"}
                      {dateQuickSelect === "spring-2026" && " this Spring"}
                      {dateQuickSelect === "summer-2026" && " this Summer"}:
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="block text-xs text-zinc-500">
                          Start
                        </label>
                        <input
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-[#D94F2B] focus:outline-none focus:ring-2 focus:ring-[#D94F2B]/20"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-zinc-500">
                          End
                        </label>
                        <input
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-[#D94F2B] focus:outline-none focus:ring-2 focus:ring-[#D94F2B]/20"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Manual fallback dates */}
                {showManualDates && (
                  <div className="mt-3">
                    <p className="text-xs text-zinc-400 mb-2">
                      {dateQuickSelect ? "Adjust dates:" : "Or pick exact dates:"}
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="block text-xs text-zinc-500">
                          Start Date
                        </label>
                        <input
                          type="date"
                          value={startDate}
                          onChange={(e) => {
                            setStartDate(e.target.value);
                            setDateQuickSelect(null);
                          }}
                          className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-[#D94F2B] focus:outline-none focus:ring-2 focus:ring-[#D94F2B]/20"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-zinc-500">
                          End Date
                        </label>
                        <input
                          type="date"
                          value={endDate}
                          onChange={(e) => {
                            setEndDate(e.target.value);
                            setDateQuickSelect(null);
                          }}
                          className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-[#D94F2B] focus:outline-none focus:ring-2 focus:ring-[#D94F2B]/20"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Duration */}
                {duration && !flexibleDates && (
                  <p className="mt-2 text-sm font-medium text-[#D94F2B]">
                    {duration}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* STEP 3 — Group Details                                            */}
        {/* ================================================================= */}
        {step === 3 && (
          <div className="mt-8 animate-[fadeSlideIn_200ms_ease-out]">
            <h2 className="text-2xl font-bold tracking-tight text-zinc-900">
              Group details
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              How many golfers, and what&apos;s the budget?
            </p>

            <div className="mt-6 space-y-8">
              {/* ---------- Group size slider ---------- */}
              <div>
                <label className="block text-sm font-medium text-zinc-700">
                  How many golfers?
                </label>

                <div className="mt-4 text-center">
                  <span className="text-4xl font-bold text-zinc-900">
                    {groupSize}
                  </span>
                  <p className="mt-1 text-sm text-zinc-500">
                    {grpLabel.emoji} {grpLabel.label}
                  </p>
                </div>

                <div className="mt-4 px-1">
                  <input
                    type="range"
                    min={2}
                    max={20}
                    step={1}
                    value={groupSize}
                    onChange={(e) => setGroupSize(parseInt(e.target.value))}
                    className="w-full h-2 rounded-full appearance-none cursor-pointer bg-zinc-200 accent-[#D94F2B] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-8 [&::-webkit-slider-thumb]:h-8 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#D94F2B] [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-8 [&::-moz-range-thumb]:h-8 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-[#D94F2B] [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:shadow-lg [&::-moz-range-thumb]:cursor-pointer"
                  />
                  <div className="flex justify-between mt-1 px-0.5">
                    {[2, 4, 6, 8, 10, 12, 16, 20].map((n) => (
                      <span
                        key={n}
                        className="text-[10px] text-zinc-400 select-none"
                      >
                        {n}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* ---------- Budget slider ---------- */}
              <div>
                <label className="block text-sm font-medium text-zinc-700">
                  Budget per person
                </label>

                <div className="mt-4 text-center">
                  <span className={`text-lg font-bold ${budgetTextColor}`}>
                    {BUDGETS[budgetIdx].label}
                  </span>
                  <p className="mt-0.5 text-sm text-zinc-500">
                    {BUDGETS[budgetIdx].subtitle}
                  </p>
                </div>

                <div className="mt-4 px-1">
                  <input
                    type="range"
                    min={0}
                    max={3}
                    step={1}
                    value={budgetIdx}
                    onChange={(e) =>
                      setBudgetTier(BUDGETS[parseInt(e.target.value)].id)
                    }
                    className={`w-full h-2 rounded-full appearance-none cursor-pointer bg-zinc-200 ${budgetThumbClass} [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-8 [&::-webkit-slider-thumb]:h-8 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-8 [&::-moz-range-thumb]:h-8 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:shadow-lg [&::-moz-range-thumb]:cursor-pointer`}
                  />
                  <div className="flex justify-between mt-1 px-0.5">
                    {BUDGETS.map((b) => (
                      <span
                        key={b.id}
                        className="text-[10px] text-zinc-400 select-none"
                      >
                        {b.label}
                      </span>
                    ))}
                  </div>
                </div>

                {bHint && (
                  <p className="mt-3 text-xs text-zinc-500">{bHint}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* STEP 4 — Name & Notes                                             */}
        {/* ================================================================= */}
        {step === 4 && (
          <div className="mt-8 animate-[fadeSlideIn_200ms_ease-out]">
            <h2 className="text-2xl font-bold tracking-tight text-zinc-900">
              Name your trip
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              We generated a name &mdash; feel free to change it.
            </p>

            <div className="mt-6 space-y-5">
              {/* ---------- Trip name ---------- */}
              <div>
                <label className="block text-sm font-medium text-zinc-700">
                  Trip Name *
                </label>
                <div className="relative mt-1">
                  <Sparkles className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-amber-400 pointer-events-none" />
                  <input
                    type="text"
                    value={tripName}
                    onChange={(e) => setTripName(e.target.value)}
                    className="block w-full rounded-lg border border-zinc-300 pl-9 pr-3 py-2.5 text-lg font-semibold text-zinc-900 focus:border-[#D94F2B] focus:outline-none focus:ring-2 focus:ring-[#D94F2B]/20"
                  />
                </div>

                {/* Alternative name suggestions */}
                {names.length > 1 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {names.slice(1, 4).map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setTripName(n)}
                        className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-150 active:scale-95 min-h-[36px] ${
                          tripName === n
                            ? "bg-emerald-100 text-[#D94F2B] border border-[#D94F2B]/40"
                            : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 border border-transparent"
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* ---------- Notes with suggestion chips ---------- */}
              <div>
                <label className="block text-sm font-medium text-zinc-700">
                  Anything else the crew should know?
                </label>

                <div className="mt-2 flex flex-wrap gap-2">
                  {NOTE_CHIPS.map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => handleNoteChip(chip)}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-150 active:scale-95 min-h-[36px] ${
                        addedChips.has(chip)
                          ? "bg-emerald-100 text-[#D94F2B] border border-[#D94F2B]/40"
                          : "bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-50 hover:border-zinc-300"
                      }`}
                    >
                      {chip}
                      {addedChips.has(chip) && (
                        <Check className="inline ml-1 h-3 w-3" />
                      )}
                    </button>
                  ))}
                </div>

                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Type any additional notes..."
                  className="mt-2 block w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-[#D94F2B] focus:outline-none focus:ring-2 focus:ring-[#D94F2B]/20"
                />
              </div>

              {/* ---------- Summary card ---------- */}
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
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500">Dates</span>
                    <span className="font-medium text-zinc-900">
                      {flexibleDates
                        ? "Flexible"
                        : duration
                          ? `${startDate} \u2014 ${endDate}`
                          : startDate || endDate
                            ? `${startDate}${startDate && endDate ? " \u2014 " : ""}${endDate}`
                            : "\u2014"}
                    </span>
                  </div>
                  {duration && !flexibleDates && (
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-500">Duration</span>
                      <span className="font-medium text-zinc-900">
                        {duration}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500">Group</span>
                    <span className="font-medium text-zinc-900">
                      {grpLabel.emoji} {groupSize} golfers &mdash;{" "}
                      {grpLabel.label}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500">Budget</span>
                    <span className="font-medium text-zinc-900">
                      {BUDGETS.find((b) => b.id === budgetTier)?.label ||
                        "\u2014"}
                    </span>
                  </div>
                  {tripName && (
                    <div className="flex justify-between text-sm pt-2 border-t border-zinc-100">
                      <span className="text-zinc-500">Trip Name</span>
                      <span className="font-semibold text-zinc-900">
                        {tripName}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* Navigation — sticky on mobile                                     */}
        {/* ================================================================= */}
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur border-t border-zinc-200 px-4 py-3 sm:static sm:bg-transparent sm:backdrop-blur-none sm:border-0 sm:px-0 sm:py-0 sm:mt-8 z-30">
          <div className="mx-auto max-w-2xl flex items-center justify-between">
            {step > 1 ? (
              <button
                type="button"
                onClick={goBack}
                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-50 min-h-[44px]"
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
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#D94F2B] px-6 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#B83D25] disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.97] min-h-[44px]"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting || !tripName.trim()}
                className="inline-flex items-center gap-2 rounded-lg bg-[#D94F2B] px-8 py-3 text-base font-semibold text-white transition-all hover:bg-[#B83D25] disabled:opacity-50 active:scale-[0.97] min-h-[48px] shadow-lg shadow-[#D94F2B]/25"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating your trip...
                  </>
                ) : (
                  "Create Trip"
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Keyframe for step fade-slide-in */}
      <style jsx global>{`
        @keyframes fadeSlideIn {
          from {
            opacity: 0;
            transform: translateX(24px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
}
