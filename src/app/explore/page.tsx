"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import knowledgeBase from "@/data/nassau-knowledge-base.json";
import {
  resolveDestinationImage,
  getRegionGradient,
  type DestinationImageSource,
} from "@/lib/destination-images";
import { HeroBackdrop } from "@/components/HeroBackdrop";

// ============================================
// NASSAU EXPLORE PAGE v4 — Cream Theme + Auth Gate + Paywall
// All destination data from nassau-knowledge-base.json (zero API calls)
// Auth: Supabase client session check before any trip creation
// Paywall: 1 free trip → $9.99/trip or $6.99/mo
// ============================================

// ─── KB Types ────────────────────────────────────────────────

interface KBItineraryItem {
  time: string;
  type: string;
  title: string;
  cost_pp: number;
}
interface KBItineraryDay {
  day: number;
  title: string;
  items: KBItineraryItem[];
}
interface KBItinerary {
  duration_nights: number;
  ideal_group_size: string;
  estimated_cost_pp: number;
  days: KBItineraryDay[];
}
interface KBCourse {
  name: string;
  greens_fee_range: string;
  difficulty?: string;
}
interface KBDestination {
  id: string;
  destination: string;
  region: string;
  nearest_airport: string;
  best_months: string[];
  avoid_months: string[];
  vibe: string[];
  price_tier: string;
  avg_cost_per_person_per_day: { budget: number; mid: number; premium: number };
  group_size_sweet_spot: string;
  why_go: string;
  top_courses: KBCourse[];
  hidden_gems: { name: string; greens_fee_range: string; must_know?: string }[];
  lodging_options: { type: string; name: string; per_night_range?: string; typical_per_night?: string; note?: string }[];
  dining: { name: string; type: string; price: string; group_note?: string }[];
  non_golf_activities: { name: string; note?: string }[];
  insider_tips: string[];
  sample_itineraries: Record<string, KBItinerary>;
}
interface TripData {
  id: string; dest: string; region: string; tagline: string; vibe: string[];
  tier: string; cost: number; title: string; courses: number; nights: number;
  best: string; featured: boolean; height: "tall" | "medium" | "short";
  whyGo: string; topCourses: KBCourse[];
  hiddenGems: { name: string; greens_fee_range: string; must_know?: string }[];
  lodging: { type: string; name: string; per_night_range?: string; typical_per_night?: string; note?: string }[];
  dining: { name: string; type: string; price: string; group_note?: string }[];
  nonGolf: { name: string; note?: string }[];
  insiderTips: string[]; itinerary: KBItinerary | null; itineraryKey: string | null;
  groupSize: string; costPerDay: { budget: number; mid: number; premium: number };
}

// ─── Maps ────────────────────────────────────────────────────

const VIBE_LABEL_MAP: Record<string, string> = {
  premium: "Resort", resort: "Resort", nightlife: "Party",
  "bachelor-party-friendly": "Bachelor", "budget-friendly": "Budget",
  "volume-golf": "Competitive", "group-trip": "Relaxed", "bucket-list": "Bucket List",
  bucket_list: "Bucket List", traditional: "Relaxed", "golf-purist": "Competitive",
  historic: "Relaxed", "father-son": "Father-Son", entertainment: "Party",
  "food-scene": "Relaxed", "live-music": "Party", "laid-back": "Relaxed",
  "young-group": "Party", beach: "Relaxed", coastal: "Relaxed", relaxed: "Relaxed",
  "family-friendly": "Father-Son", lowcountry: "Relaxed", couples: "Relaxed",
  luxury: "Bucket List", "once-in-a-lifetime": "Bucket List", "special-occasion": "Bucket List",
  ocean: "Relaxed", "walking-only": "Competitive", links: "Competitive",
  "boys-trip": "Party", modern: "Resort", "hidden-gem-vibe": "Relaxed",
  "hidden-gem": "Relaxed", "mid-century": "Relaxed", "pool-scene": "Resort",
  "bourbon-trail": "Party", international: "Bucket List", mountain: "Scenic",
  scenic: "Scenic", outdoors: "Relaxed", "summer-escape": "Relaxed",
  casino: "Party", desert: "Relaxed", "midwest-getaway": "Relaxed",
  competitive: "Competitive", corporate: "Corporate", party: "Party",
  "Ozark-scenery": "Scenic", casual: "Relaxed",
};
const TIER_MAP: Record<string, string> = {
  budget: "$", "budget-mid": "$-$$", mid: "$$", "mid-high": "$$-$$$", premium: "$$$", luxury: "$$$$",
};
const FEATURED_IDS = new Set([
  "scottsdale-az", "pinehurst-nc", "pebble-beach-monterey-ca",
  "bandon-dunes-or", "st-andrews-scotland", "kohler-wi",
  "rtj-trail-al", "kapalua-maui-hi", "southwest-ireland",
]);
const ACCENT_COLORS: Record<string, string> = {
  "Bucket List": "#0C2E1E", Party: "#9C27B0", Relaxed: "#00897B",
  Competitive: "#C62828", "Father-Son": "#1565C0", Budget: "#2E7D32",
  Corporate: "#37474F", Bachelor: "#E65100", Resort: "#E8751A", Scenic: "#0277BD",
};
const TYPE_EMOJI: Record<string, string> = {
  tee_time: "⛳", dinner: "🍽️", activity: "🎯", travel: "✈️", other: "📌",
};

// ─── Helpers ─────────────────────────────────────────────────

function cardHeight(tier: string): "tall" | "medium" | "short" {
  if (tier === "luxury" || tier === "premium") return "tall";
  if (tier === "mid-high" || tier === "mid") return "medium";
  return "short";
}
function formatBestMonths(months: string[]): string {
  if (!months || months.length === 0) return "Year-round";
  if (months.length <= 2) return months.join("-");
  return `${months[0]}-${months[months.length - 1]}`;
}
function mapVibes(kbVibes: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const v of kbVibes) {
    const label = VIBE_LABEL_MAP[v] || v.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
    if (!seen.has(label)) { seen.add(label); result.push(label); }
    if (result.length >= 2) break;
  }
  return result;
}
function buildTagline(whyGo: string): string {
  const first = whyGo.split(/[.!]/).filter(Boolean)[0]?.trim() || whyGo;
  return first.length <= 60 ? first : first.slice(0, 57).replace(/\s+\S*$/, "") + "...";
}
function buildTitle(dest: string, kbVibes: string[]): string {
  const city = dest.split(",")[0].trim();
  const pv = kbVibes[0] || "";
  if (pv.includes("bachelor") || pv.includes("nightlife")) return `The ${city} Classic`;
  if (pv.includes("budget")) return `${city} Value Trip`;
  if (pv.includes("bucket") || pv.includes("luxury")) return `${city} Dream Trip`;
  if (pv.includes("golf-purist") || pv.includes("competitive")) return `${city} Championship`;
  if (pv.includes("father-son") || pv.includes("family")) return `${city} Family Getaway`;
  if (pv.includes("corporate")) return `${city} Executive Retreat`;
  return `The ${city} Trip`;
}

// ─── Build TRIPS_DATA from KB ─────────────────────────────────

const destinations: KBDestination[] = (knowledgeBase as unknown as { destinations: KBDestination[] }).destinations;

const TRIPS_DATA: TripData[] = destinations.map((d) => {
  const itinKeys = Object.keys(d.sample_itineraries || {});
  const itineraryKey = itinKeys[0] || null;
  const itinerary = itineraryKey ? (d.sample_itineraries as Record<string, KBItinerary>)[itineraryKey] : null;
  const nights = itinerary?.duration_nights ?? 3;
  const cost = itinerary?.estimated_cost_pp ?? (d.avg_cost_per_person_per_day?.mid ?? 100) * nights;
  const courseCount = itinerary?.days
    ? itinerary.days.reduce((sum, day) => sum + (day.items || []).filter(i => i.type === "tee_time").length, 0)
    : (d.top_courses || []).length;
  const isFeatured = FEATURED_IDS.has(d.id);
  return {
    id: d.id, dest: d.destination, region: d.region,
    tagline: buildTagline(d.why_go), vibe: mapVibes(d.vibe || []),
    tier: TIER_MAP[d.price_tier] || "$$", cost,
    title: buildTitle(d.destination, d.vibe),
    courses: courseCount, nights, best: formatBestMonths(d.best_months || []),
    featured: isFeatured, height: isFeatured ? "tall" as const : cardHeight(d.price_tier),
    whyGo: d.why_go || "", topCourses: d.top_courses || [],
    hiddenGems: d.hidden_gems || [], lodging: d.lodging_options || [],
    dining: d.dining || [], nonGolf: d.non_golf_activities || [],
    insiderTips: d.insider_tips || [], itinerary, itineraryKey,
    groupSize: d.group_size_sweet_spot,
    costPerDay: d.avg_cost_per_person_per_day || { budget: 0, mid: 0, premium: 0 },
  };
});

// ─── Filter constants ─────────────────────────────────────────
// Photo/Unsplash maps have moved to `src/lib/destination-images.ts` so the
// Explore page, the trip preview page, and any marketing surface share a
// single source of truth and a consistent local-first fallback chain.

const VIBES = ["All", "Bucket List", "Party", "Relaxed", "Competitive", "Father-Son", "Budget", "Corporate", "Bachelor", "Resort", "Scenic"];
const REGIONS = ["All", "Southeast", "Southwest", "West Coast", "Midwest", "Pacific NW", "Northeast", "Mid-Atlantic", "International", "Mountain West", "Gulf Coast", "Hawaii", "South Central"];
const PRICES = ["All", "$", "$-$$", "$$", "$$-$$$", "$$$", "$$$$"];

// ─── Destination Card Image ───────────────────────────────────
// Renders the resolved DestinationImageSource with a runtime onError
// escape hatch: if the image 404s (stale CDN, missing file), we swap in a
// region-themed gradient so the card never renders as a blank block.

function DestinationCardImage({
  source,
  region,
  vibe,
  alt,
  priority = false,
  sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw",
}: {
  source: DestinationImageSource;
  region?: string;
  vibe?: string[];
  alt: string;
  priority?: boolean;
  sizes?: string;
}) {
  const [failed, setFailed] = useState(false);
  const fallbackGradient = getRegionGradient(region, vibe);

  if (source.kind === "gradient" || failed) {
    const gradient = source.kind === "gradient" ? source.gradient : fallbackGradient;
    return <div className={`absolute inset-0 ${gradient}`} aria-hidden="true" />;
  }

  return (
    <Image
      src={source.src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      className="object-cover pointer-events-none group-hover:scale-105 transition-transform duration-700"
      onError={() => setFailed(true)}
      draggable={false}
    />
  );
}

// ─── Auth Gate ────────────────────────────────────────────────

function AuthGate({ tripTitle, destSlug, onClose }: { tripTitle: string; destSlug: string; onClose: () => void }) {
  const nextParam = encodeURIComponent(`/trips/create?destination=${destSlug}`);
  const signInHref = `/login?next=${nextParam}`;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div className="relative bg-[#FDFAF5] rounded-2xl w-full max-w-sm p-8 shadow-2xl border border-[#E2D9CC]"
        onClick={(e) => e.stopPropagation()} style={{ animation: "fadeInScale 0.25s ease-out" }}>
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#2D5A3D]/10 mb-4">
            <span className="text-2xl font-semibold text-[#2D5A3D]">N</span>
          </div>
          <h2 className="text-xl font-bold text-[#1A1A1A]">Sign in to plan this trip</h2>
          <p className="text-sm text-[#5A4F45] mt-2 leading-relaxed">
            <span className="font-semibold text-[#1A1A1A]">{tripTitle}</span> is ready to go.<br />
            Create your free account to save it.
          </p>
        </div>
        <div className="bg-[#2D5A3D]/8 border border-[#2D5A3D]/20 rounded-xl p-3 mb-5 text-center">
          <p className="text-xs font-semibold text-[#2D5A3D] uppercase tracking-wide mb-1">Your first trip is free</p>
          <p className="text-xs text-[#5A4F45]">No credit card required to get started</p>
        </div>
        <Link href={signInHref}
          className="block w-full py-3.5 rounded-xl bg-[#2D5A3D] text-white text-center font-bold text-sm hover:bg-[#244B33] transition-colors shadow-lg shadow-[#2D5A3D]/20 mb-2">
          Create Free Account →
        </Link>
        <Link href={signInHref}
          className="block w-full py-3 rounded-xl border border-[#E2D9CC] text-[#1A1A1A] text-center font-medium text-sm hover:bg-[#F2F0EB] transition-colors mb-3">
          Sign In
        </Link>
        <button onClick={onClose} className="block w-full text-xs text-[#8A8078] hover:text-[#1A1A1A] transition-colors text-center">
          Keep browsing
        </button>
      </div>
    </div>
  );
}

// ─── Paywall Modal ────────────────────────────────────────────

function PaywallModal({ tripTitle, onClose, onPerTrip }: {
  tripTitle: string; onClose: () => void; onPerTrip: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div className="relative bg-[#FDFAF5] rounded-2xl w-full max-w-sm p-8 shadow-2xl border border-[#E2D9CC]"
        onClick={(e) => e.stopPropagation()} style={{ animation: "fadeInScale 0.25s ease-out" }}>
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#2D5A3D]/10 mb-4">
            <span className="text-2xl">⛳</span>
          </div>
          <h2 className="text-xl font-bold text-[#1A1A1A]">Ready for another trip?</h2>
          <p className="text-sm text-[#5A4F45] mt-2 leading-relaxed">
            You&apos;ve used your free trip. Unlock{" "}
            <span className="font-semibold text-[#1A1A1A]">{tripTitle}</span> with a pass or go Pro.
          </p>
        </div>
        {/* Per-trip */}
        <button onClick={onPerTrip}
          className="w-full rounded-xl border-2 border-[#E2D9CC] hover:border-[#2D5A3D]/50 bg-white p-4 text-left mb-3 transition-all">
          <div className="flex items-center justify-between mb-0.5">
            <span className="font-bold text-[#1A1A1A] text-sm">Per-Trip Pass</span>
            <span className="text-lg font-semibold text-[#1A1A1A]">$9.99</span>
          </div>
          <p className="text-xs text-[#5A4F45]">One trip, full access. No subscription needed.</p>
        </button>
        {/* Pro */}
        <Link href="/login?plan=pro"
          className="block w-full rounded-xl bg-[#2D5A3D] p-4 text-left mb-4 shadow-lg shadow-[#2D5A3D]/20 hover:bg-[#244B33] transition-colors">
          <div className="flex items-center justify-between mb-0.5">
            <span className="font-bold text-white text-sm">Nassau Pro</span>
            <div><span className="text-lg font-semibold text-white">$6.99</span><span className="text-white/70 text-xs">/mo</span></div>
          </div>
          <p className="text-xs text-white/80">Unlimited trips · $49.99/yr · 30-day free trial</p>
        </Link>
        <button onClick={onClose} className="block w-full text-xs text-[#8A8078] hover:text-[#1A1A1A] transition-colors text-center">
          Maybe later
        </button>
      </div>
    </div>
  );
}

// ─── Trip Card ────────────────────────────────────────────────

function TripCard({ trip, onClick }: { trip: TripData; index: number; onClick: (t: TripData) => void }) {
  const image = resolveDestinationImage(trip.id, {
    region: trip.region,
    vibe: trip.vibe,
    width: 800,
    height: 1067, // match aspect-[3/4]
  });
  const accentColor = ACCENT_COLORS[trip.vibe?.[0]] || "#2D5A3D";

  return (
    // min-h target for the whole card keeps the tap zone >= 44px tall
    <button
      type="button"
      onClick={() => onClick(trip)}
      aria-label={`Open ${trip.title} — ${trip.dest}`}
      className="group relative block w-full text-left rounded-2xl overflow-hidden shadow-sm hover:shadow-xl focus-visible:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D5A3D] transition-all duration-500 hover:-translate-y-1 aspect-[3/4] bg-[#1a1a1a]"
    >
      {/* Hero image / gradient fallback */}
      <DestinationCardImage
        source={image}
        region={trip.region}
        vibe={trip.vibe}
        alt={`${trip.dest} — ${trip.title}`}
      />

      {/* Bottom-up scrim so text stays readable */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(to top, rgba(17,17,17,0.92) 0%, rgba(17,17,17,0.70) 28%, rgba(17,17,17,0.25) 58%, rgba(17,17,17,0.05) 80%, rgba(17,17,17,0) 100%)",
        }}
      />

      {/* Featured ribbon */}
      {trip.featured && (
        <div className="absolute top-3 left-3 bg-[#C9A54E] text-[#2a1d00] text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-md z-10 tracking-wide uppercase">
          ★ Editor&apos;s Pick
        </div>
      )}

      {/* Price tier badge */}
      <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-[#1A1A1A] text-[11px] font-semibold px-2.5 py-1 rounded-full z-10 tracking-wide">
        {trip.tier}
      </div>

      {/* Content — overlaid bottom of card */}
      <div className="absolute inset-x-0 bottom-0 z-10 p-4 sm:p-5">
        {/* Vibe pills */}
        {(trip.vibe || []).length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2.5">
            {(trip.vibe || []).slice(0, 2).map((v) => (
              <span
                key={v}
                className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-semibold backdrop-blur-sm"
                style={{
                  backgroundColor: `${ACCENT_COLORS[v] || accentColor}cc`,
                  color: "white",
                }}
              >
                {v}
              </span>
            ))}
          </div>
        )}

        {/* Title (Playfair) */}
        <h3 className="font-serif text-white text-xl sm:text-[1.375rem] leading-tight font-medium mb-1 drop-shadow-md">
          {trip.title}
        </h3>

        {/* Destination + region (Inter) */}
        <p className="font-sans text-white/80 text-xs sm:text-sm mb-3">
          {trip.dest}
        </p>

        {/* Meta row — trip length + cost */}
        <div className="flex items-center justify-between gap-2 border-t border-white/15 pt-3">
          <span className="font-sans text-white/80 text-[11px] sm:text-xs tracking-wide">
            {trip.nights}N · {trip.courses} rounds
          </span>
          <span className="font-sans text-white text-sm sm:text-base font-semibold">
            from ${trip.cost.toLocaleString()}
            <span className="text-white/60 text-[11px] font-normal">/person</span>
          </span>
        </div>
      </div>
    </button>
  );
}

// ─── Trip Modal ───────────────────────────────────────────────

type ModalState = "modal" | "auth-gate" | "paywall";

function TripModal({ trip, onClose }: { trip: TripData; onClose: () => void }) {
  const router = useRouter();
  const [state, setState] = useState<ModalState>("modal");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const modalImage = resolveDestinationImage(trip.id, {
    region: trip.region,
    vibe: trip.vibe,
    width: 800,
    height: 400,
  });

  async function handlePlanTrip() {
    setError(null);
    setCreating(true);
    try {
      // 1. Check if user is logged in
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setCreating(false);
        setState("auth-gate");
        return;
      }
      // 2. Check how many trips they've already created
      const countRes = await fetch("/api/trips/count");
      if (!countRes.ok) throw new Error("Could not verify account status");
      const { count } = await countRes.json();
      // 3. Gate after first free trip
      if (count >= 1) {
        setCreating(false);
        setState("paywall");
        return;
      }
      // 4. Free — create and redirect
      await createTrip();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setCreating(false);
    }
  }

  async function createTrip() {
    setCreating(true);
    setError(null);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const itineraryItems: any[] = [];
      if (trip.itinerary) {
        let sortOrder = 0;
        for (const day of trip.itinerary.days || []) {
          for (const item of day.items || []) {
            itineraryItems.push({
              day_number: day.day, date: "", time: item.time, title: item.title,
              type: ["tee_time","dinner","travel","activity"].includes(item.type) ? item.type : "other",
              description: `Day ${day.day}: ${day.title}`,
              cost: item.cost_pp ?? 0, booking_status: "", sort_order: sortOrder++,
            });
          }
        }
      }
      const res = await fetch("/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trip.title, destination: trip.dest,
          startDate: "", endDate: "",
          vibe: (trip.vibe || []).join(", "), budgetTier: trip.tier,
          groupSizeTarget: trip.groupSize,
          notes: `Created from Nassau Explore — ${trip.dest}. ${(trip.whyGo || "").slice(0, 200)}`,
          itineraryItems,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Server error ${res.status}`);
      }
      const data = await res.json();
      router.push(`/trips/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create trip");
      setCreating(false);
    }
  }

  function handlePerTrip() {
    router.push(`/login?plan=per-trip&dest=${encodeURIComponent(trip.id)}`);
  }

  if (state === "auth-gate") return <AuthGate tripTitle={trip.title} destSlug={trip.id} onClose={onClose} />;
  if (state === "paywall") return <PaywallModal tripTitle={trip.title} onClose={onClose} onPerTrip={handlePerTrip} />;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative bg-[#FDFAF5] rounded-t-3xl sm:rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl border border-[#E2D9CC]"
        onClick={(e) => e.stopPropagation()} style={{ animation: "slideUp 0.3s ease-out" }}>
        {/* Header image */}
        <div className="relative h-52 overflow-hidden rounded-t-3xl sm:rounded-t-2xl group">
          <DestinationCardImage
            source={modalImage}
            region={trip.region}
            vibe={trip.vibe}
            alt={trip.dest}
            priority
            sizes="(max-width: 640px) 100vw, 512px"
          />
          <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-[#FDFAF5] to-transparent" />
          <div className="absolute bottom-4 left-5 right-5">
            <h2 className="text-[#1A1A1A] text-2xl font-bold">{trip.title}</h2>
            <p className="text-[#5A4F45] text-sm mt-1">{trip.dest} · {trip.region}</p>
          </div>
          <button onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 bg-[#FDFAF5]/80 backdrop-blur-sm rounded-full flex items-center justify-center text-[#1A1A1A] hover:bg-[#FDFAF5] transition border border-[#E2D9CC]">
            ✕
          </button>
        </div>

        <div className="p-5">
          <p className="text-[#5A4F45] text-sm leading-relaxed mb-4">{trip.whyGo}</p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            {[{ label: "Duration", value: `${trip.nights} nights` }, { label: "Rounds", value: `${trip.courses} courses` }, { label: "Best Time", value: trip.best }].map((s) => (
              <div key={s.label} className="bg-[#F2F0EB] rounded-xl p-3 text-center border border-[#E2D9CC]">
                <div className="text-xs text-[#8A8078] mb-1">{s.label}</div>
                <div className="text-sm font-semibold text-[#1A1A1A]">{s.value}</div>
              </div>
            ))}
          </div>

          {/* Vibes */}
          <div className="flex flex-wrap gap-2 mb-5">
            {(trip.vibe || []).map((v) => (
              <span key={v} className="text-sm px-3 py-1 rounded-full font-medium"
                style={{ backgroundColor: `${ACCENT_COLORS[v] || "#5A4F45"}15`, color: ACCENT_COLORS[v] || "#5A4F45" }}>
                {v}
              </span>
            ))}
          </div>

          {/* Itinerary */}
          {trip.itinerary && (
            <div className="mb-5">
              <h3 className="text-sm font-bold mb-3 text-[#1A1A1A]">
                Sample Itinerary · {trip.itinerary.duration_nights} nights · {trip.itinerary.ideal_group_size} players
              </h3>
              <div className="space-y-3">
                {(trip.itinerary.days || []).map((day) => (
                  <div key={day.day} className="bg-[#F2F0EB] rounded-xl p-3 border border-[#E2D9CC]">
                    <div className="text-xs font-semibold mb-2 text-[#1A1A1A]">Day {day.day}: {day.title}</div>
                    <div className="space-y-1.5">
                      {(day.items || []).map((item, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-xs">
                          <span className="shrink-0 w-14 text-[#8A8078]">{item.time}</span>
                          <span className="shrink-0">{TYPE_EMOJI[item.type] || "📌"}</span>
                          <span className="text-[#5A4F45] flex-1">{item.title}</span>
                          {item.cost_pp > 0 && <span className="text-[#8A8078] shrink-0">${item.cost_pp}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top Courses */}
          {(trip.topCourses?.length ?? 0) > 0 && (
            <div className="mb-5">
              <h3 className="text-sm font-bold mb-2 text-[#1A1A1A]">Top Courses</h3>
              <div className="space-y-2">
                {trip.topCourses.slice(0, 4).map((c) => (
                  <div key={c.name} className="flex items-center justify-between text-xs bg-[#F2F0EB] rounded-lg px-3 py-2 border border-[#E2D9CC]">
                    <div>
                      <div className="font-medium text-[#1A1A1A]">{c.name}</div>
                      {c.difficulty && <span className="text-[#8A8078]">{c.difficulty}</span>}
                    </div>
                    <span className="text-[#5A4F45] font-medium">{c.greens_fee_range}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Price */}
          <div className="bg-[#F2F0EB] rounded-xl p-4 mb-5 border border-[#E2D9CC]">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-[#2D5A3D] font-medium">Estimated total</div>
                <div className="text-2xl font-bold text-[#1A1A1A]">
                  ${trip.cost.toLocaleString()}<span className="text-sm font-normal text-[#8A8078]"> /person</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-[#8A8078]">Price tier</div>
                <div className="text-lg font-semibold text-[#1A1A1A]">{trip.tier}</div>
              </div>
            </div>
            {trip.costPerDay && (
              <div className="mt-2 flex gap-4 text-xs text-[#8A8078]">
                <span>Budget: ${trip.costPerDay.budget}/day</span>
                <span>Mid: ${trip.costPerDay.mid}/day</span>
                <span>Premium: ${trip.costPerDay.premium}/day</span>
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
          )}

          {/* CTA */}
          <button onClick={handlePlanTrip} disabled={creating}
            className="w-full py-3.5 rounded-xl text-white font-bold text-base transition-all duration-200 hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
            style={{ backgroundColor: "#2D5A3D" }}>
            {creating ? "Checking your account..." : "Plan This Trip →"}
          </button>
          <p className="text-center text-xs text-[#8A8078] mt-2">First trip free · No card required to start</p>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────

type SortKey = "popular" | "price-asc" | "price-desc";
const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "popular", label: "Popular" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
];

export default function NassauExplore() {
  const [selectedVibe, setSelectedVibe] = useState("All");
  const [selectedRegion, setSelectedRegion] = useState("All");
  const [selectedPrice, setSelectedPrice] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTrip, setSelectedTrip] = useState<TripData | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [sort, setSort] = useState<SortKey>("popular");

  const filteredTrips = useMemo(() => {
    const filtered = TRIPS_DATA.filter((t) => {
      if (selectedVibe !== "All" && !t.vibe.includes(selectedVibe)) return false;
      if (selectedRegion !== "All" && t.region !== selectedRegion) return false;
      if (selectedPrice !== "All" && t.tier !== selectedPrice) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return t.dest.toLowerCase().includes(q) || t.title.toLowerCase().includes(q) || t.tagline.toLowerCase().includes(q);
      }
      return true;
    });

    // Apply sort. "Popular" = featured first, then by editorial rank preserved
    // from the KB array order.
    const sorted = [...filtered];
    if (sort === "price-asc") {
      sorted.sort((a, b) => a.cost - b.cost);
    } else if (sort === "price-desc") {
      sorted.sort((a, b) => b.cost - a.cost);
    } else {
      sorted.sort((a, b) => Number(b.featured) - Number(a.featured));
    }
    return sorted;
  }, [selectedVibe, selectedRegion, selectedPrice, searchQuery, sort]);

  const activeFilterCount = [selectedVibe, selectedRegion, selectedPrice].filter(f => f !== "All").length;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F2F0EB" }}>
      <style>{`
        @keyframes slideUp { from { transform: translateY(100px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeInScale { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        .trip-card { animation: fadeIn 0.5s ease-out forwards; opacity: 0; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* HERO — full-bleed backdrop with Playfair headline */}
      <HeroBackdrop
        src="/images/hero-backdrop.png"
        alt="Clifftop sunset green"
        height="md"
        priority
      >
        <p className="font-sans text-[11px] font-medium uppercase tracking-[0.08em] text-white/70 mb-2">
          Explore Nassau
        </p>
        <h1 className="font-serif text-4xl md:text-5xl font-medium tracking-tight">
          Where to next?
        </h1>
        <p className="font-sans mt-2 text-white/75 text-sm md:text-base max-w-xl">
          {TRIPS_DATA.length} curated trips across {TRIPS_DATA.length} destinations.
          Find your next round, or let Nassau plan one for your crew.
        </p>
      </HeroBackdrop>

      {/* FILTERS + SORT */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 pb-4">
        <div className="mb-3 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <input
            type="text"
            placeholder="Search destinations…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="font-sans w-full sm:w-72 min-h-[44px] px-4 py-2.5 rounded-xl border border-[#E2D9CC] bg-[#FDFAF5] text-sm text-[#1A1A1A] placeholder-[#8A8078] focus:outline-none focus:border-[#2D5A3D] transition-colors"
          />
          <div className="flex items-center gap-2">
            <label htmlFor="explore-sort" className="font-sans text-xs text-[#8A8078] uppercase tracking-wide">
              Sort
            </label>
            <select
              id="explore-sort"
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="font-sans min-h-[44px] px-3 py-2 rounded-xl border border-[#E2D9CC] bg-[#FDFAF5] text-sm text-[#1A1A1A] focus:outline-none focus:border-[#2D5A3D] transition-colors"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 sm:-mx-6 sm:px-6">
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="font-sans flex items-center gap-1.5 min-h-[44px] px-4 py-2 rounded-full text-sm font-semibold border-2 transition whitespace-nowrap"
            style={{
              borderColor: activeFilterCount > 0 ? "#2D5A3D" : "#E2D9CC",
              backgroundColor: activeFilterCount > 0 ? "#2D5A3D" : "#FDFAF5",
              color: activeFilterCount > 0 ? "white" : "#5A4F45",
            }}
          >
            ☰ Filters
            {activeFilterCount > 0 && (
              <span className="bg-white text-[#2D5A3D] w-5 h-5 rounded-full text-xs flex items-center justify-center font-bold ml-1">
                {activeFilterCount}
              </span>
            )}
          </button>
          {VIBES.slice(1).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setSelectedVibe(selectedVibe === v ? "All" : v)}
              className="font-sans min-h-[44px] px-4 py-2 rounded-full text-sm font-medium border transition whitespace-nowrap"
              style={{
                borderColor: selectedVibe === v ? "#2D5A3D" : "#E2D9CC",
                backgroundColor: selectedVibe === v ? "#2D5A3D" : "#FDFAF5",
                color: selectedVibe === v ? "white" : "#5A4F45",
              }}
            >
              {v}
            </button>
          ))}
        </div>

        {showFilters && (
          <div className="mt-3 p-4 bg-[#FDFAF5] rounded-2xl border border-[#E2D9CC] shadow-sm" style={{ animation: "fadeIn 0.2s ease-out" }}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-[#8A8078] mb-2 block uppercase tracking-wide">Region</label>
                <div className="flex flex-wrap gap-1.5">
                  {REGIONS.map((r) => (
                    <button key={r} onClick={() => setSelectedRegion(r)}
                      className="px-2.5 py-1 rounded-full text-xs font-medium border transition"
                      style={{ borderColor: selectedRegion === r ? "#2D5A3D" : "#E2D9CC", backgroundColor: selectedRegion === r ? "#2D5A3D" : "transparent", color: selectedRegion === r ? "white" : "#5A4F45" }}>
                      {r}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-[#8A8078] mb-2 block uppercase tracking-wide">Price</label>
                <div className="flex flex-wrap gap-1.5">
                  {PRICES.map((p) => (
                    <button key={p} onClick={() => setSelectedPrice(p)}
                      className="px-2.5 py-1 rounded-full text-xs font-medium border transition"
                      style={{ borderColor: selectedPrice === p ? "#2D5A3D" : "#E2D9CC", backgroundColor: selectedPrice === p ? "#2D5A3D" : "transparent", color: selectedPrice === p ? "white" : "#5A4F45" }}>
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {activeFilterCount > 0 && (
              <button onClick={() => { setSelectedVibe("All"); setSelectedRegion("All"); setSelectedPrice("All"); }}
                className="mt-3 text-xs text-[#8A8078] hover:text-[#2D5A3D] underline transition-colors">
                Clear all filters
              </button>
            )}
          </div>
        )}

        <div className="mt-3 text-sm text-[#8A8078]">{filteredTrips.length} trip{filteredTrips.length !== 1 ? "s" : ""}</div>
      </div>

      {/* GRID — mobile: 1 col, tablet: 2 col, desktop: 3 col */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
        <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filteredTrips.map((trip, i) => (
            <div key={trip.id} className="trip-card" style={{ animationDelay: `${Math.min(i, 12) * 40}ms` }}>
              <TripCard trip={trip} index={i} onClick={setSelectedTrip} />
            </div>
          ))}
        </div>
        {filteredTrips.length === 0 && (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🏌️‍♂️</div>
            <h3 className="font-serif text-xl font-medium mb-2 text-[#1A1A1A]">No trips match those filters</h3>
            <p className="font-sans text-[#8A8078] text-sm">Try adjusting your filters or search query</p>
            <button
              type="button"
              onClick={() => {
                setSelectedVibe("All");
                setSelectedRegion("All");
                setSelectedPrice("All");
                setSearchQuery("");
              }}
              className="font-sans mt-4 min-h-[44px] px-5 py-2 rounded-full text-sm font-semibold text-white bg-[#2D5A3D] hover:bg-[#244B33] transition-colors"
            >
              Reset filters
            </button>
          </div>
        )}
      </div>

      {/* BOTTOM CTA */}
      <div className="border-t border-[#E2D9CC] py-12 bg-[#1A1A1A]">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="font-headline text-2xl sm:text-3xl font-medium text-white mb-3">Don&apos;t see your perfect trip?</h2>
          <p className="text-zinc-400 text-sm mb-6 max-w-md mx-auto">
            Tell Nassau what you&apos;re looking for and we&apos;ll build a custom trip for your crew in under 60 seconds.
          </p>
          <a href="/trips/create/ai"
            className="inline-block px-8 py-3.5 rounded-full text-base font-bold bg-[#2D5A3D] text-white hover:bg-[#244B33] transition-colors hover:shadow-xl">
            Plan My Trip ✨
          </a>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="border-t border-[#E2D9CC] px-6 py-8 bg-[#F2F0EB]">
        <div className="mx-auto max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="font-headline text-lg font-medium text-[#2D5A3D] tracking-tight">Nassau</span>
            <span className="text-xs text-[#5A4F45]">Plan trips. Track rounds. Settle bets.</span>
          </div>
          <div className="flex items-center gap-6 text-xs text-[#5A4F45]">
            <Link href="/blog" className="hover:text-[#1A1A1A] transition-colors">Blog</Link>
            <Link href="/explore" className="hover:text-[#1A1A1A] transition-colors">Explore Destinations</Link>
            <a href="mailto:grayson@nassau.golf" className="hover:text-[#1A1A1A] transition-colors">Contact</a>
          </div>
        </div>
      </footer>

      {/* MODAL */}
      {selectedTrip && <TripModal trip={selectedTrip} onClose={() => setSelectedTrip(null)} />}
    </div>
  );
}
