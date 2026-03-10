"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import knowledgeBase from "@/data/nassau-knowledge-base.json";

// ============================================
// NASSAU EXPLORE PAGE v4 — Cream Theme + Auth Gate + Paywall
// All destination data from nassau-knowledge-base.json (zero API calls)
// Auth: Supabase client session check before any trip creation
// Paywall: 1 free trip → $4.99/trip or $6.99/mo
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

// ─── Photo Map ────────────────────────────────────────────────

interface PhotoEntry { photo: string; fallback: string; credit: string; }
const PHOTO_MAP: Record<string, PhotoEntry> = {
  "scottsdale-az": { photo: "photo-1682686581362-e05e14b37bcb", fallback: "from-amber-600 to-orange-800", credit: "Unsplash" },
  "myrtle-beach-sc": { photo: "photo-1507525428034-b723cf961d3e", fallback: "from-sky-400 to-blue-600", credit: "Unsplash" },
  "pinehurst-nc": { photo: "photo-1587174486073-ae5e5cff23aa", fallback: "from-green-700 to-emerald-900", credit: "Unsplash" },
  "las-vegas-nv": { photo: "photo-1605833556294-ea5c7a74f57d", fallback: "from-purple-600 to-fuchsia-700", credit: "Unsplash" },
  "austin-tx": { photo: "photo-1531218150217-54595bc2b934", fallback: "from-orange-500 to-red-600", credit: "Unsplash" },
  "san-diego-ca": { photo: "photo-1538970272646-f61fabb3a8a2", fallback: "from-cyan-400 to-blue-500", credit: "Unsplash" },
  "hilton-head-sc": { photo: "photo-1535131749006-b7f58c99034b", fallback: "from-teal-500 to-green-600", credit: "Unsplash" },
  "pebble-beach-monterey-ca": { photo: "photo-1587174486073-ae5e5cff23aa", fallback: "from-slate-600 to-blue-900", credit: "Unsplash" },
  "kiawah-island-sc": { photo: "photo-1600166898405-da9535204843", fallback: "from-emerald-600 to-teal-800", credit: "Unsplash" },
  "bandon-dunes-or": { photo: "photo-1560088939-3dc36f0d00e8", fallback: "from-gray-500 to-slate-700", credit: "Unsplash" },
  "streamsong-fl": { photo: "photo-1592919505780-303950717480", fallback: "from-lime-500 to-green-700", credit: "Unsplash" },
  "palm-springs-ca": { photo: "photo-1509233725247-49e657c54213", fallback: "from-yellow-400 to-orange-500", credit: "Unsplash" },
  "savannah-ga": { photo: "photo-1597424216809-3ba4c3dc3cf9", fallback: "from-green-600 to-emerald-800", credit: "Unsplash" },
  "cabo-san-lucas-mx": { photo: "photo-1524260855046-f743b3cdad07", fallback: "from-blue-400 to-teal-600", credit: "Unsplash" },
  "branson-mo": { photo: "photo-1505672678657-cc7037095e60", fallback: "from-green-500 to-lime-700", credit: "Unsplash" },
  "gulf-shores-al": { photo: "photo-1510414842594-a61c69b5ae57", fallback: "from-sky-300 to-blue-500", credit: "Unsplash" },
  "lake-tahoe-ca": { photo: "photo-1489659831163-682b5af42225", fallback: "from-blue-500 to-indigo-700", credit: "Unsplash" },
  "mesquite-nv": { photo: "photo-1509316975850-ff9c5deb0cd9", fallback: "from-red-600 to-orange-700", credit: "Unsplash" },
  "wisconsin-dells-sand-valley-wi": { photo: "photo-1535131749006-b7f58c99034b", fallback: "from-green-500 to-emerald-700", credit: "Unsplash" },
  "st-andrews-scotland": { photo: "photo-1551882547-ff40c63fe5fa", fallback: "from-stone-500 to-slate-700", credit: "Unsplash" },
  "charleston-sc": { photo: "photo-1569880153113-76e33fc52d5f", fallback: "from-rose-400 to-pink-600", credit: "Unsplash" },
  "nashville-tn": { photo: "photo-1545419913-ef0cbcbbf7f4", fallback: "from-yellow-500 to-amber-600", credit: "Unsplash" },
  "destin-fl": { photo: "photo-1519046904884-53103b34b206", fallback: "from-emerald-300 to-cyan-500", credit: "Unsplash" },
  "orlando-fl": { photo: "photo-1575089976121-8ed7b2a54265", fallback: "from-orange-400 to-red-500", credit: "Unsplash" },
  "williamsburg-va": { photo: "photo-1558618666-fcd25c85f82e", fallback: "from-amber-700 to-stone-800", credit: "Unsplash" },
  "reynolds-lake-oconee-ga": { photo: "photo-1501785888041-af3ef285b470", fallback: "from-blue-400 to-green-600", credit: "Unsplash" },
  "rtj-trail-al": { photo: "photo-1632932693498-7e44d6ab504c", fallback: "from-red-700 to-red-900", credit: "Unsplash" },
  "cape-cod-ma": { photo: "photo-1499092346589-b9b6be3e94b2", fallback: "from-blue-300 to-sky-500", credit: "Unsplash" },
  "kohler-wi": { photo: "photo-1600166898405-da9535204843", fallback: "from-green-800 to-slate-900", credit: "Unsplash" },
  "tucson-az": { photo: "photo-1469854523086-cc02fe5d8800", fallback: "from-orange-600 to-red-800", credit: "Unsplash" },
  "bend-or": { photo: "photo-1464278533981-50106e6176b1", fallback: "from-amber-500 to-green-600", credit: "Unsplash" },
  "park-city-ut": { photo: "photo-1483728642387-6c3bdd6c93e5", fallback: "from-blue-400 to-purple-600", credit: "Unsplash" },
  "coeur-dalene-id": { photo: "photo-1439066615861-d1af74d74000", fallback: "from-blue-500 to-cyan-600", credit: "Unsplash" },
  "amelia-island-fl": { photo: "photo-1519046904884-53103b34b206", fallback: "from-teal-400 to-emerald-600", credit: "Unsplash" },
  "pawleys-island-sc": { photo: "photo-1535131749006-b7f58c99034b", fallback: "from-green-500 to-teal-700", credit: "Unsplash" },
  "sedona-az": { photo: "photo-1527549993586-dff825b37782", fallback: "from-red-500 to-orange-700", credit: "Unsplash" },
  "french-lick-in": { photo: "photo-1587174486073-ae5e5cff23aa", fallback: "from-green-600 to-amber-700", credit: "Unsplash" },
  "atlantic-city-nj": { photo: "photo-1596394516093-501ba68a0ba6", fallback: "from-purple-500 to-blue-600", credit: "Unsplash" },
  "finger-lakes-ny": { photo: "photo-1506377247377-2a5b3b417ebb", fallback: "from-violet-400 to-purple-600", credit: "Unsplash" },
  "kapalua-maui-hi": { photo: "photo-1542259009477-d625272157b7", fallback: "from-teal-400 to-blue-600", credit: "Unsplash" },
  "riviera-maya-mx": { photo: "photo-1552733407-5d5c46c3bb3b", fallback: "from-emerald-400 to-teal-600", credit: "Unsplash" },
  "punta-cana-dr": { photo: "photo-1505881502353-a1986add3762", fallback: "from-cyan-400 to-blue-500", credit: "Unsplash" },
  "algarve-portugal": { photo: "photo-1555881400-74d7acaacd8b", fallback: "from-yellow-400 to-orange-500", credit: "Unsplash" },
  "southwest-ireland": { photo: "photo-1564959130747-897a8e5b89c0", fallback: "from-green-500 to-emerald-700", credit: "Unsplash" },
  "torrey-pines-la-jolla-ca": { photo: "photo-1538970272646-f61fabb3a8a2", fallback: "from-sky-400 to-blue-600", credit: "Unsplash" },
  "hershey-pa": { photo: "photo-1587174486073-ae5e5cff23aa", fallback: "from-amber-600 to-stone-700", credit: "Unsplash" },
  "grand-rapids-mi": { photo: "photo-1504280390367-361c6d9f38f4", fallback: "from-amber-400 to-green-600", credit: "Unsplash" },
  "ozarks-ar": { photo: "photo-1505672678657-cc7037095e60", fallback: "from-green-600 to-teal-700", credit: "Unsplash" },
  "pinehurst-extended-nc": { photo: "photo-1587174486073-ae5e5cff23aa", fallback: "from-green-800 to-emerald-950", credit: "Unsplash" },
  "bethlehem-lehigh-valley-pa": { photo: "photo-1587174486073-ae5e5cff23aa", fallback: "from-gray-500 to-slate-700", credit: "Unsplash" },
};

function unsplashUrl(photoId: string, w = 600, h = 400): string {
  return `https://images.unsplash.com/${photoId}?w=${w}&h=${h}&fit=crop&q=80&auto=format`;
}

const VIBES = ["All", "Bucket List", "Party", "Relaxed", "Competitive", "Father-Son", "Budget", "Corporate", "Bachelor", "Resort", "Scenic"];
const REGIONS = ["All", "Southeast", "Southwest", "West Coast", "Midwest", "Pacific NW", "Northeast", "Mid-Atlantic", "International", "Mountain West", "Gulf Coast", "Hawaii", "South Central"];
const PRICES = ["All", "$", "$-$$", "$$", "$$-$$$", "$$$", "$$$$"];

// ─── Image With Fallback ──────────────────────────────────────

function ImageWithFallback({ src, fallbackGradient, alt, className }: {
  src: string; fallbackGradient: string; alt: string; className: string;
}) {
  const [failed, setFailed] = useState(false);
  if (failed) return <div className={`${className} bg-gradient-to-br ${fallbackGradient}`} />;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} className={`${className} object-cover pointer-events-none`}
    onError={() => setFailed(true)} loading="lazy" draggable={false} />;
}

// ─── Auth Gate ────────────────────────────────────────────────

function AuthGate({ tripTitle, onClose }: { tripTitle: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div className="relative bg-[#FDFAF5] rounded-2xl w-full max-w-sm p-8 shadow-2xl border border-[#E2D9CC]"
        onClick={(e) => e.stopPropagation()} style={{ animation: "fadeInScale 0.25s ease-out" }}>
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#D94F2B]/10 mb-4">
            <span className="text-2xl font-black text-[#D94F2B]">N</span>
          </div>
          <h2 className="text-xl font-bold text-[#1A1A1A]">Sign in to plan this trip</h2>
          <p className="text-sm text-[#5A4F45] mt-2 leading-relaxed">
            <span className="font-semibold text-[#1A1A1A]">{tripTitle}</span> is ready to go.<br />
            Create your free account to save it.
          </p>
        </div>
        <div className="bg-[#D94F2B]/8 border border-[#D94F2B]/20 rounded-xl p-3 mb-5 text-center">
          <p className="text-xs font-semibold text-[#B83D25] uppercase tracking-wide mb-1">Your first trip is free</p>
          <p className="text-xs text-[#5A4F45]">No credit card required to get started</p>
        </div>
        <Link href="/login?redirect=/explore"
          className="block w-full py-3.5 rounded-xl bg-[#D94F2B] text-white text-center font-bold text-sm hover:bg-[#c4442a] transition-colors shadow-lg shadow-[#D94F2B]/20 mb-2">
          Create Free Account →
        </Link>
        <Link href="/login?redirect=/explore"
          className="block w-full py-3 rounded-xl border border-[#E2D9CC] text-[#1A1A1A] text-center font-medium text-sm hover:bg-[#F3EDE4] transition-colors mb-3">
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
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#D94F2B]/10 mb-4">
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
          className="w-full rounded-xl border-2 border-[#E2D9CC] hover:border-[#D94F2B]/50 bg-white p-4 text-left mb-3 transition-all">
          <div className="flex items-center justify-between mb-0.5">
            <span className="font-bold text-[#1A1A1A] text-sm">Per-Trip Pass</span>
            <span className="text-lg font-black text-[#1A1A1A]">$4.99</span>
          </div>
          <p className="text-xs text-[#5A4F45]">One trip, full access. No subscription needed.</p>
        </button>
        {/* Pro */}
        <Link href="/login?plan=pro"
          className="block w-full rounded-xl bg-[#D94F2B] p-4 text-left mb-4 shadow-lg shadow-[#D94F2B]/20 hover:bg-[#c4442a] transition-colors">
          <div className="flex items-center justify-between mb-0.5">
            <span className="font-bold text-white text-sm">Nassau Pro</span>
            <div><span className="text-lg font-black text-white">$6.99</span><span className="text-white/70 text-xs">/mo</span></div>
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
  const pm = PHOTO_MAP[trip.id];
  const imgUrl = pm ? unsplashUrl(pm.photo, 600, trip.height === "tall" ? 500 : trip.height === "medium" ? 380 : 300) : null;
  const heightClass = trip.height === "tall" ? "h-96" : trip.height === "medium" ? "h-72" : "h-56";
  const accentColor = ACCENT_COLORS[trip.vibe?.[0]] || "#5A4F45";

  return (
    <div className="group cursor-pointer break-inside-avoid mb-4" onClick={() => onClick(trip)}>
      <div className="relative rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-1 bg-[#FDFAF5] border border-[#E2D9CC]">
        <div className={`relative ${heightClass} overflow-hidden`}>
          {imgUrl ? (
            <ImageWithFallback src={imgUrl} fallbackGradient={pm?.fallback || "from-gray-500 to-gray-700"}
              alt={trip.dest} className="absolute inset-0 w-full h-full group-hover:scale-105 transition-transform duration-700" />
          ) : (
            <div className={`absolute inset-0 bg-gradient-to-br ${pm?.fallback || "from-gray-500 to-gray-700"}`} />
          )}
          {trip.featured && (
            <div className="absolute top-3 left-3 bg-amber-400 text-amber-900 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-md z-10">
              ⭐ EDITOR&apos;S PICK
            </div>
          )}
          <div className="absolute top-3 right-3 bg-[#FDFAF5]/90 backdrop-blur-sm text-[#1A1A1A] text-xs font-semibold px-2.5 py-1 rounded-full z-10 border border-[#E2D9CC]/80">
            {trip.tier}
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#FDFAF5] via-[#FDFAF5]/60 to-transparent z-10" />
          <div className="absolute bottom-3 left-3 right-3 z-10">
            <h3 className="text-[#1A1A1A] text-lg font-bold leading-tight mb-0.5">{trip.title}</h3>
            <p className="text-[#5A4F45] text-sm">{trip.dest}</p>
          </div>
        </div>
        <div className="p-3.5">
          <p className="text-[#5A4F45] text-sm mb-2.5 leading-snug">{trip.tagline}</p>
          <div className="flex items-center gap-3 text-xs text-[#8A8078] mb-2.5">
            <span>🌙 {trip.nights}N</span>
            <span>⛳ {trip.courses} rounds</span>
            <span>📅 {trip.best}</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(trip.vibe || []).map((v) => (
              <span key={v} className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ backgroundColor: `${ACCENT_COLORS[v] || accentColor}12`, color: ACCENT_COLORS[v] || accentColor }}>
                {v}
              </span>
            ))}
          </div>
          <div className="mt-2.5 pt-2.5 border-t border-[#E2D9CC] flex items-center justify-between">
            <span className="text-xs text-[#8A8078]">from</span>
            <span className="text-base font-bold text-[#1A1A1A]">
              ${trip.cost.toLocaleString()}<span className="text-xs font-normal text-[#8A8078]">/person</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Trip Modal ───────────────────────────────────────────────

type ModalState = "modal" | "auth-gate" | "paywall";

function TripModal({ trip, onClose }: { trip: TripData; onClose: () => void }) {
  const router = useRouter();
  const [state, setState] = useState<ModalState>("modal");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pm = PHOTO_MAP[trip.id];
  const imgUrl = pm ? unsplashUrl(pm.photo, 800, 400) : null;

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

  if (state === "auth-gate") return <AuthGate tripTitle={trip.title} onClose={onClose} />;
  if (state === "paywall") return <PaywallModal tripTitle={trip.title} onClose={onClose} onPerTrip={handlePerTrip} />;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative bg-[#FDFAF5] rounded-t-3xl sm:rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl border border-[#E2D9CC]"
        onClick={(e) => e.stopPropagation()} style={{ animation: "slideUp 0.3s ease-out" }}>
        {/* Header image */}
        <div className="relative h-52 overflow-hidden rounded-t-3xl sm:rounded-t-2xl">
          {imgUrl ? (
            <ImageWithFallback src={imgUrl} fallbackGradient={pm?.fallback || "from-gray-500 to-gray-700"}
              alt={trip.dest} className="absolute inset-0 w-full h-full" />
          ) : (
            <div className={`absolute inset-0 bg-gradient-to-br ${pm?.fallback || "from-gray-500 to-gray-700"}`} />
          )}
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
              <div key={s.label} className="bg-[#F3EDE4] rounded-xl p-3 text-center border border-[#E2D9CC]">
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
                  <div key={day.day} className="bg-[#F3EDE4] rounded-xl p-3 border border-[#E2D9CC]">
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
                  <div key={c.name} className="flex items-center justify-between text-xs bg-[#F3EDE4] rounded-lg px-3 py-2 border border-[#E2D9CC]">
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
          <div className="bg-[#F3EDE4] rounded-xl p-4 mb-5 border border-[#E2D9CC]">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-[#B83D25] font-medium">Estimated total</div>
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
            style={{ backgroundColor: "#D94F2B" }}>
            {creating ? "Checking your account..." : "Plan This Trip →"}
          </button>
          <p className="text-center text-xs text-[#8A8078] mt-2">First trip free · No card required to start</p>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────

export default function NassauExplore() {
  const [selectedVibe, setSelectedVibe] = useState("All");
  const [selectedRegion, setSelectedRegion] = useState("All");
  const [selectedPrice, setSelectedPrice] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTrip, setSelectedTrip] = useState<TripData | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const filteredTrips = useMemo(() => {
    return TRIPS_DATA.filter((t) => {
      if (selectedVibe !== "All" && !t.vibe.includes(selectedVibe)) return false;
      if (selectedRegion !== "All" && t.region !== selectedRegion) return false;
      if (selectedPrice !== "All" && t.tier !== selectedPrice) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return t.dest.toLowerCase().includes(q) || t.title.toLowerCase().includes(q) || t.tagline.toLowerCase().includes(q);
      }
      return true;
    });
  }, [selectedVibe, selectedRegion, selectedPrice, searchQuery]);

  const activeFilterCount = [selectedVibe, selectedRegion, selectedPrice].filter(f => f !== "All").length;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F3EDE4" }}>
      <style>{`
        @keyframes slideUp { from { transform: translateY(100px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeInScale { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        .trip-card { animation: fadeIn 0.5s ease-out forwards; opacity: 0; }
        .masonry { column-count: 2; column-gap: 16px; }
        @media (min-width: 768px) { .masonry { column-count: 3; } }
        @media (min-width: 1024px) { .masonry { column-count: 4; } }
        @media (max-width: 640px) { .masonry { column-count: 1; } }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* HERO */}
      <div className="max-w-7xl mx-auto px-4 pt-8 pb-4">
        <p className="text-xs font-semibold text-[#B83D25] uppercase tracking-widest mb-1">Nassau</p>
        <h1 className="text-3xl sm:text-4xl font-black mb-2 text-[#1A1A1A]">Explore Golf Trips</h1>
        <p className="text-[#5A4F45] text-base max-w-xl">
          50 curated trips across 50 destinations. Find your next round, or let us plan one for you.
        </p>
      </div>

      {/* FILTERS */}
      <div className="max-w-7xl mx-auto px-4 pb-4">
        <div className="mb-3">
          <input type="text" placeholder="Search destinations..." value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-72 px-4 py-2.5 rounded-xl border border-[#E2D9CC] bg-[#FDFAF5] text-sm text-[#1A1A1A] placeholder-[#8A8078] focus:outline-none focus:border-[#D94F2B] transition-colors" />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <button onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-semibold border-2 transition whitespace-nowrap"
            style={{
              borderColor: activeFilterCount > 0 ? "#D94F2B" : "#E2D9CC",
              backgroundColor: activeFilterCount > 0 ? "#D94F2B" : "#FDFAF5",
              color: activeFilterCount > 0 ? "white" : "#5A4F45",
            }}>
            ☰ Filters{activeFilterCount > 0 && (
              <span className="bg-white text-[#D94F2B] w-5 h-5 rounded-full text-xs flex items-center justify-center font-bold ml-1">
                {activeFilterCount}
              </span>
            )}
          </button>
          {VIBES.slice(1).map((v) => (
            <button key={v} onClick={() => setSelectedVibe(selectedVibe === v ? "All" : v)}
              className="px-3.5 py-2 rounded-full text-sm font-medium border transition whitespace-nowrap"
              style={{
                borderColor: selectedVibe === v ? "#D94F2B" : "#E2D9CC",
                backgroundColor: selectedVibe === v ? "#D94F2B" : "#FDFAF5",
                color: selectedVibe === v ? "white" : "#5A4F45",
              }}>
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
                      style={{ borderColor: selectedRegion === r ? "#D94F2B" : "#E2D9CC", backgroundColor: selectedRegion === r ? "#D94F2B" : "transparent", color: selectedRegion === r ? "white" : "#5A4F45" }}>
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
                      style={{ borderColor: selectedPrice === p ? "#D94F2B" : "#E2D9CC", backgroundColor: selectedPrice === p ? "#D94F2B" : "transparent", color: selectedPrice === p ? "white" : "#5A4F45" }}>
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {activeFilterCount > 0 && (
              <button onClick={() => { setSelectedVibe("All"); setSelectedRegion("All"); setSelectedPrice("All"); }}
                className="mt-3 text-xs text-[#8A8078] hover:text-[#D94F2B] underline transition-colors">
                Clear all filters
              </button>
            )}
          </div>
        )}

        <div className="mt-3 text-sm text-[#8A8078]">{filteredTrips.length} trip{filteredTrips.length !== 1 ? "s" : ""}</div>
      </div>

      {/* GRID */}
      <div className="max-w-7xl mx-auto px-4 pb-16">
        <div className="masonry">
          {filteredTrips.map((trip, i) => (
            <div key={trip.id} className="trip-card" style={{ animationDelay: `${i * 40}ms` }}>
              <TripCard trip={trip} index={i} onClick={setSelectedTrip} />
            </div>
          ))}
        </div>
        {filteredTrips.length === 0 && (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🏌️‍♂️</div>
            <h3 className="text-xl font-bold mb-2 text-[#1A1A1A]">No trips match those filters</h3>
            <p className="text-[#8A8078] text-sm">Try adjusting your filters or search query</p>
            <button onClick={() => { setSelectedVibe("All"); setSelectedRegion("All"); setSelectedPrice("All"); setSearchQuery(""); }}
              className="mt-4 px-5 py-2 rounded-full text-sm font-semibold text-white bg-[#D94F2B] hover:bg-[#c4442a] transition-colors">
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* BOTTOM CTA */}
      <div className="border-t border-[#E2D9CC] py-12 bg-[#1A1A1A]">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">Don&apos;t see your perfect trip?</h2>
          <p className="text-zinc-400 text-sm mb-6 max-w-md mx-auto">
            Tell Nassau what you&apos;re looking for and we&apos;ll build a custom trip for your crew in under 60 seconds.
          </p>
          <a href="/trips/create/ai"
            className="inline-block px-8 py-3.5 rounded-full text-base font-bold bg-[#D94F2B] text-white hover:bg-[#c4442a] transition-colors hover:shadow-xl">
            Plan My Trip ✨
          </a>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="border-t border-[#E2D9CC] px-6 py-8 bg-[#F3EDE4]">
        <div className="mx-auto max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-lg font-extrabold text-[#D94F2B] tracking-tight">Nassau</span>
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
