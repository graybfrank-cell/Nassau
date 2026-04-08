import { findDestination, loadKnowledgeBase } from "./marketing-kb";

/** Slug aliases for landing page IDs that don't match KB IDs exactly */
const SLUG_ALIASES: Record<string, string> = {
  "pebble-beach-monterey-ca": "pebble-beach-ca",
};

/** The 8 launch destinations to statically generate */
export const LAUNCH_DESTINATION_SLUGS = [
  "bandon-dunes-or",
  "pinehurst-nc",
  "scottsdale-az",
  "myrtle-beach-sc",
  "pebble-beach-ca",
  "st-andrews-scotland",
  "streamsong-fl",
  "sand-valley-wi",
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
  days: ItineraryDay[];
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
