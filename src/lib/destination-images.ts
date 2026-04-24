/**
 * Destination image resolution for the Explore page and any other surface
 * that renders a destination card.
 *
 * Resolution order, highest priority first:
 *   1. Local hero image registered in DESTINATION_IMAGE_MANIFEST
 *      (files live under public/images/destinations/)
 *   2. A region-themed CSS gradient via getRegionGradient(region, vibe)
 *
 * When Grayson (or anyone) drops a new file in public/images/destinations/
 * named `{slug}.jpg` (or .png/.webp), add one line to the manifest and it
 * will start rendering on the Explore page immediately. Hero photography is
 * sourced from Nano Banana Pro and committed to the repo — no third-party
 * CDN lookups happen at request time.
 */
export type DestinationImageSource =
  | { kind: "local"; src: string }
  | { kind: "gradient"; gradient: string };

// ─── Local manifest ───────────────────────────────────────────
// Keys are destination IDs (slugs) from src/data/nassau-knowledge-base.json.
// Values are absolute URL paths (public/ is served at /).
// Paths with spaces or commas are URL-encoded so Next.js serves them cleanly.
export const DESTINATION_IMAGE_MANIFEST: Record<string, string> = {
  // Slug-named files (preferred going forward)
  "hilton-head-sc": "/images/destinations/hilton-head-sc.png",
  "pebble-beach-monterey-ca": "/images/destinations/pebble-beach-monterey-ca.jpg",
  "st-andrews-scotland": "/images/destinations/st-andrews-scotland.jpg",
  "scottsdale-az": "/images/destinations/scottsdale-az.png",
  "bandon-dunes-or": "/images/destinations/bandon-dunes-or.png",
  // Legacy filenames preserved via URL-encoded paths so existing art keeps
  // rendering without requiring large binary rewrites.
  "cabo-san-lucas-mx": "/images/destinations/CaboSanLucasTripCard.png",
  "kapalua-maui-hi":
    "/images/destinations/Kapalua%2C%20HITrip%20Card.png",
  "kiawah-island-sc": "/images/destinations/KiwahIslandSCtripcard.png",
  "kohler-wi": "/images/destinations/Kohler%2C%20WI-tripcard.png",
  "palm-springs-ca": "/images/destinations/PalmSpringsTripCard.png",
  "reynolds-lake-oconee-ga":
    "/images/destinations/Reynolds%20Lake%20Oconee%2C%20GATripCard.png",
};

// ─── Region → theme key ───────────────────────────────────────
// Derived primarily from the destination's `region` field in the KB, with
// vibe tags as secondary signals. See getRegionGradient() below.
const REGION_THEME_KEYS: Record<string, ThemeKey> = {
  Southwest: "desert",
  "South Central": "desert", // Phoenix-adjacent
  "Mountain West": "mountain",
  "West Coast": "coastal",
  "Pacific NW": "coastal",
  Northeast: "forest",
  "Mid-Atlantic": "forest",
  Southeast: "coastal", // most SE trips are coastal
  "Gulf Coast": "coastal",
  Midwest: "forest",
  Hawaii: "tropical",
  International: "international",
};

// Vibe overrides are more specific than region, so they win when present.
const VIBE_THEME_OVERRIDES: Record<string, ThemeKey> = {
  desert: "desert",
  beach: "coastal",
  coastal: "coastal",
  ocean: "coastal",
  mountain: "mountain",
  scenic: "mountain",
  casino: "party",
  nightlife: "party",
  entertainment: "party",
  tropical: "tropical",
  international: "international",
};

export type ThemeKey =
  | "desert"
  | "coastal"
  | "forest"
  | "mountain"
  | "tropical"
  | "party"
  | "international"
  | "default";

// Tailwind gradient class names. Using class names (rather than inline CSS)
// so they compose cleanly with other utility classes in the Explore cards.
export const THEME_GRADIENTS: Record<ThemeKey, string> = {
  desert: "from-amber-500 via-orange-600 to-[#7a2e12]",
  coastal: "from-[#0d7377] via-[#12415c] to-[#0a1f33]",
  forest: "from-[#3f6b4d] via-[#2d5a3d] to-[#18181b]",
  mountain: "from-[#6b7f5f] via-[#44553e] to-[#1f2619]",
  tropical: "from-teal-400 via-emerald-600 to-[#0a3a2f]",
  party: "from-purple-600 via-fuchsia-700 to-[#2a0a38]",
  international: "from-slate-500 via-slate-700 to-[#111418]",
  default: "from-[#2d5a3d] via-[#1f3d2a] to-[#18181b]",
};

/**
 * Map a KB destination to a theme key using region first, then vibe tags.
 */
export function getDestinationTheme(
  region: string | undefined,
  vibe: string[] | undefined
): ThemeKey {
  if (vibe && vibe.length) {
    for (const v of vibe) {
      const key = VIBE_THEME_OVERRIDES[v.toLowerCase()];
      if (key) return key;
    }
  }
  if (region && REGION_THEME_KEYS[region]) {
    return REGION_THEME_KEYS[region];
  }
  return "default";
}

/**
 * Convenience: return a Tailwind gradient class string for a given
 * region + vibe combination. Includes the `bg-gradient-to-br` prefix.
 */
export function getRegionGradient(
  region: string | undefined,
  vibe?: string[]
): string {
  const theme = getDestinationTheme(region, vibe);
  return `bg-gradient-to-br ${THEME_GRADIENTS[theme]}`;
}

/**
 * Core resolver. Given a destination slug, return a typed image source so
 * the caller can render the appropriate element (Next Image or gradient div).
 */
export function resolveDestinationImage(
  slug: string,
  options: { region?: string; vibe?: string[] } = {}
): DestinationImageSource {
  const local = DESTINATION_IMAGE_MANIFEST[slug];
  if (local) return { kind: "local", src: local };

  return {
    kind: "gradient",
    gradient: getRegionGradient(options.region, options.vibe),
  };
}

/**
 * Return true if this destination has a registered local hero image.
 * Useful for conditionally rendering an <Image> vs. a gradient div.
 */
export function hasDestinationImage(slug: string): boolean {
  return Boolean(DESTINATION_IMAGE_MANIFEST[slug]);
}

/**
 * Return the local hero URL for a slug, or null if nothing is registered.
 * Prefer resolveDestinationImage() when you also need the gradient branch.
 */
export function getDestinationImageUrl(slug: string): string | null {
  return DESTINATION_IMAGE_MANIFEST[slug] ?? null;
}

const HERO_BACKDROP_FALLBACK = "/images/hero-backdrop.png";

function slugifyDestinationInput(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Resolve an image URL from a raw destination string that may be either a
 * known slug (e.g. "scottsdale-az") or a human-readable name from a trip
 * record (e.g. "Scottsdale, AZ" or "Hilton Head Island, SC"). Tries, in
 * order: exact slug match, slugified match, fuzzy token-overlap match
 * against the registered slugs. Falls back to the generic hero backdrop
 * so callers can always render a valid <Image> src.
 */
export function getDestinationImageBySlugOrName(input: string): string {
  if (!input) return HERO_BACKDROP_FALLBACK;

  const exact = getDestinationImageUrl(input);
  if (exact) return exact;

  const slug = slugifyDestinationInput(input);
  if (slug && slug !== input) {
    const slugged = getDestinationImageUrl(slug);
    if (slugged) return slugged;
  }

  const inputTokens = new Set(slug.split("-").filter(Boolean));
  if (inputTokens.size > 0) {
    const registered = Object.keys(DESTINATION_IMAGE_MANIFEST);
    let bestSlug: string | null = null;
    let bestScore = 0;
    for (const candidate of registered) {
      const tokens = candidate.split("-");
      let score = 0;
      for (const t of tokens) if (inputTokens.has(t)) score++;
      if (score > bestScore) {
        bestScore = score;
        bestSlug = candidate;
      }
    }
    const requiredScore = Math.min(2, inputTokens.size);
    if (bestSlug && bestScore >= requiredScore) {
      const url = getDestinationImageUrl(bestSlug);
      if (url) return url;
    }
  }

  return HERO_BACKDROP_FALLBACK;
}
