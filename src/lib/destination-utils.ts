import { findDestination, loadKnowledgeBase } from "./marketing-kb";

/** Slug aliases for landing page IDs that don't match KB IDs exactly */
const SLUG_ALIASES: Record<string, string> = {
  "pebble-beach-monterey-ca": "pebble-beach-ca",
};

/** All launch destinations to statically generate */
export const LAUNCH_DESTINATION_SLUGS = [
  "bandon-dunes-or",
  "pinehurst-nc",
  "scottsdale-az",
  "myrtle-beach-sc",
  "pebble-beach-ca",
  "st-andrews-scotland",
  "streamsong-fl",
  "sand-valley-wi",
  "kiawah-island-sc",
  "kohler-wi",
  "reynolds-lake-oconee-ga",
  "cabo-san-lucas-mx",
  "kapalua-maui-hi",
  "palm-springs-ca",
  "hilton-head-sc",
];

export function resolveSlug(slug: string): string {
  return SLUG_ALIASES[slug] || slug;
}

export function getDestinationBySlug(slug: string): Destination | null {
  const resolved = resolveSlug(slug);
  return findDestination(resolved) as Destination | null;
}

export function getAllDestinationSlugs(): string[] {
  const kb = loadKnowledgeBase();
  if (!kb) return LAUNCH_DESTINATION_SLUGS;
  const destinations = kb.destinations || kb;
  if (!Array.isArray(destinations)) return LAUNCH_DESTINATION_SLUGS;
  const seen = new Set<string>();
  return destinations
    .map((d: Destination) => d.id)
    .filter((id: string) => {
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });
}

// --- Types ---

export interface Destination {
  // Core v1 fields
  id: string;
  destination: string;
  region: string;
  nearest_airport: string;
  airport_to_courses_drive: string;
  best_months: string[];
  avoid_months: string[];
  avoid_reason: string;
  vibe: string[];
  price_tier: string;
  avg_cost_per_person_per_day: { budget: number; mid: number; premium: number };
  group_size_sweet_spot: string;
  why_go: string;
  top_courses: Course[];
  hidden_gems: Course[];
  lodging_options: LodgingOption[];
  dining: DiningOption[];
  non_golf_activities: string[];
  insider_tips: string[];
  sample_itineraries: Record<string, Itinerary>;

  // v3 enriched fields (all optional — present on destinations that have been enriched)
  kit_title?: string;
  kit_subtitle?: string;
  kit_tagline?: string;
  region_visual_category?: RegionVisualCategory;
  region_subcategory?: RegionSubcategory;
  default_recommended_dates?: {
    start: string;
    end: string;
    reason: string;
  };
  recommended_itinerary?: RecommendedItineraryEntry[];
  recommended_lodging?: RecommendedLodging;
  cost_breakdown_4day?: CostBreakdownLine[];
  bonus_plays?: BonusPlay[];

  // v4 human-polish fields (still pending across all 52)
  founder_note?: string;
  booking_contacts?: BookingContact[];

  // Metadata for anti-piracy date-stamping
  verified_month?: string; // e.g. "May 2026"
}

export interface Course {
  name: string;
  greens_fee_range: string;
  difficulty: string;
  condition_rating: number;
  scenery_rating: number;
  must_know: string;
  designer?: string;
  signature_holes?: string[];
  tags?: string[];
  caddie_available?: boolean;
}

export interface LodgingOption {
  type: string;
  name: string;
  per_night_range: string;
  group_friendly: boolean;
  note: string;
}

export interface DiningOption {
  name: string;
  type: string;
  price: string;
  group_note: string;
}

export interface Itinerary {
  duration_nights: number;
  ideal_group_size: string;
  estimated_cost_pp: number;
  days?: ItineraryDay[];
}

export interface ItineraryDay {
  day: number;
  title: string;
  items: ItineraryItem[];
}

export interface ItineraryItem {
  time: string;
  type: string;
  title: string;
  cost_pp: number;
}

// --- v3 types ---

export type RegionVisualCategory =
  | "PNW"
  | "West"
  | "Southwest"
  | "Southeast"
  | "Northeast"
  | "Midwest"
  | "Mountain"
  | "Tropical"
  | "International";

export type RegionSubcategory =
  | "Scotland"
  | "Tropical-International"
  | "Mexico";

export interface RecommendedItineraryEntry {
  day: number;
  day_label: string;
  course_id: string;
  tee_time: string | null;
  tee_time_logic: string;
}

export interface RecommendedLodging {
  name: string;
  room_type: string;
  nightly_rate: number;
  why_this_one: string;
  booking_priority: string;
}

export interface CostBreakdownLine {
  item: string;
  amount: number;
}

export interface BonusPlay {
  type: string;
  name: string;
  why: string;
  when: string;
}

export interface BookingContact {
  number: number;
  priority: "critical" | "important" | "nice";
  task: string;
  contact_name: string;
  phone: string;
  email: string;
  what_to_ask: string;
  when_they_pick_up: string;
  notes: string;
}

// --- Hero image resolver ---

/**
 * Returns the hero image path for a given destination based on its
 * region_visual_category and optional region_subcategory.
 *
 * International destinations route to one of three sub-images:
 *   - Scotland (St Andrews etc.)
 *   - Mexico (Cabo)
 *   - Tropical-International (Punta Cana, Riviera Maya)
 *
 * Default fallback if no category set: PNW (visually neutral)
 */
export function getHeroImage(dest: Destination): string {
  const base = "/images/heroes";

  // Handle International with subcategory routing
  if (dest.region_visual_category === "International") {
    switch (dest.region_subcategory) {
      case "Mexico":
        return `${base}/hero-mexico.jpg`;
      case "Tropical-International":
        return `${base}/hero-tropical-intl.jpg`;
      case "Scotland":
      default:
        return `${base}/hero-scotland.jpg`;
    }
  }

  // Handle all other regions by direct mapping
  const categoryToFile: Record<Exclude<RegionVisualCategory, "International">, string> = {
    PNW: "hero-pnw.jpg",
    West: "hero-west.jpg",
    Southwest: "hero-southwest.jpg",
    Southeast: "hero-southeast.jpg",
    Northeast: "hero-northeast.jpg",
    Midwest: "hero-midwest.jpg",
    Mountain: "hero-mountain.jpg",
    Tropical: "hero-tropical.jpg",
  };

  const category = dest.region_visual_category;
  if (category && category !== "International") {
    return `${base}/${categoryToFile[category]}`;
  }

  // Fallback: PNW (visually neutral, coastal)
  return `${base}/hero-pnw.jpg`;
}
