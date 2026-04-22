/**
 * Destination image resolution for the Explore page and any other surface
 * that renders a destination card.
 *
 * Resolution order, highest priority first:
 *   1. Local hero image registered in DESTINATION_IMAGE_MANIFEST
 *      (files live under public/images/destinations/)
 *   2. Unsplash fallback URL registered in UNSPLASH_PHOTO_MAP
 *   3. A region-themed CSS gradient via getRegionGradient(region, vibe)
 *
 * When Grayson (or anyone) drops a new file in public/images/destinations/
 * named `{slug}.jpg` (or .png/.webp), add one line to the manifest and it
 * will start rendering on the Explore page immediately.
 */
export type DestinationImageSource =
  | { kind: "local"; src: string }
  | { kind: "unsplash"; src: string }
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

// ─── Unsplash fallback photo IDs ──────────────────────────────
// Lifted from the existing PHOTO_MAP on the Explore page so we have a single
// source of truth. These are Unsplash photo IDs, not full URLs.
export const UNSPLASH_PHOTO_MAP: Record<string, string> = {
  "scottsdale-az": "photo-1682686581362-e05e14b37bcb",
  "myrtle-beach-sc": "photo-1507525428034-b723cf961d3e",
  "pinehurst-nc": "photo-1587174486073-ae5e5cff23aa",
  "las-vegas-nv": "photo-1605833556294-ea5c7a74f57d",
  "austin-tx": "photo-1531218150217-54595bc2b934",
  "san-diego-ca": "photo-1538970272646-f61fabb3a8a2",
  "hilton-head-sc": "photo-1535131749006-b7f58c99034b",
  "pebble-beach-monterey-ca": "photo-1587174486073-ae5e5cff23aa",
  "kiawah-island-sc": "photo-1600166898405-da9535204843",
  "bandon-dunes-or": "photo-1560088939-3dc36f0d00e8",
  "streamsong-fl": "photo-1592919505780-303950717480",
  "palm-springs-ca": "photo-1509233725247-49e657c54213",
  "savannah-ga": "photo-1597424216809-3ba4c3dc3cf9",
  "cabo-san-lucas-mx": "photo-1524260855046-f743b3cdad07",
  "branson-mo": "photo-1505672678657-cc7037095e60",
  "gulf-shores-al": "photo-1510414842594-a61c69b5ae57",
  "lake-tahoe-ca": "photo-1489659831163-682b5af42225",
  "mesquite-nv": "photo-1509316975850-ff9c5deb0cd9",
  "wisconsin-dells-sand-valley-wi": "photo-1535131749006-b7f58c99034b",
  "st-andrews-scotland": "photo-1551882547-ff40c63fe5fa",
  "charleston-sc": "photo-1569880153113-76e33fc52d5f",
  "nashville-tn": "photo-1545419913-ef0cbcbbf7f4",
  "destin-fl": "photo-1519046904884-53103b34b206",
  "orlando-fl": "photo-1575089976121-8ed7b2a54265",
  "williamsburg-va": "photo-1558618666-fcd25c85f82e",
  "reynolds-lake-oconee-ga": "photo-1501785888041-af3ef285b470",
  "rtj-trail-al": "photo-1632932693498-7e44d6ab504c",
  "cape-cod-ma": "photo-1499092346589-b9b6be3e94b2",
  "kohler-wi": "photo-1600166898405-da9535204843",
  "tucson-az": "photo-1469854523086-cc02fe5d8800",
  "bend-or": "photo-1464278533981-50106e6176b1",
  "park-city-ut": "photo-1483728642387-6c3bdd6c93e5",
  "coeur-dalene-id": "photo-1439066615861-d1af74d74000",
  "amelia-island-fl": "photo-1519046904884-53103b34b206",
  "pawleys-island-sc": "photo-1535131749006-b7f58c99034b",
  "sedona-az": "photo-1527549993586-dff825b37782",
  "french-lick-in": "photo-1587174486073-ae5e5cff23aa",
  "atlantic-city-nj": "photo-1596394516093-501ba68a0ba6",
  "finger-lakes-ny": "photo-1506377247377-2a5b3b417ebb",
  "kapalua-maui-hi": "photo-1542259009477-d625272157b7",
  "riviera-maya-mx": "photo-1552733407-5d5c46c3bb3b",
  "punta-cana-dr": "photo-1505881502353-a1986add3762",
  "algarve-portugal": "photo-1555881400-74d7acaacd8b",
  "southwest-ireland": "photo-1564959130747-897a8e5b89c0",
  "torrey-pines-la-jolla-ca": "photo-1538970272646-f61fabb3a8a2",
  "hershey-pa": "photo-1587174486073-ae5e5cff23aa",
  "grand-rapids-mi": "photo-1504280390367-361c6d9f38f4",
  "ozarks-ar": "photo-1505672678657-cc7037095e60",
  "pinehurst-extended-nc": "photo-1587174486073-ae5e5cff23aa",
  "bethlehem-lehigh-valley-pa": "photo-1587174486073-ae5e5cff23aa",
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
 * Build an Unsplash CDN URL from a photo ID.
 */
export function buildUnsplashUrl(
  photoId: string,
  w: number = 800,
  h: number = 600
): string {
  return `https://images.unsplash.com/${photoId}?w=${w}&h=${h}&fit=crop&q=80&auto=format`;
}

/**
 * Core resolver. Given a destination slug (and optional width/height for
 * the Unsplash fallback), return a typed image source so the caller can
 * render the appropriate element (Next Image, img, or gradient div).
 */
export function resolveDestinationImage(
  slug: string,
  options: { region?: string; vibe?: string[]; width?: number; height?: number } = {}
): DestinationImageSource {
  const local = DESTINATION_IMAGE_MANIFEST[slug];
  if (local) return { kind: "local", src: local };

  const unsplashId = UNSPLASH_PHOTO_MAP[slug];
  if (unsplashId) {
    return {
      kind: "unsplash",
      src: buildUnsplashUrl(unsplashId, options.width ?? 800, options.height ?? 600),
    };
  }

  return {
    kind: "gradient",
    gradient: getRegionGradient(options.region, options.vibe),
  };
}

/**
 * Return true if this destination has any non-gradient artwork available.
 * Useful for conditionally rendering an <Image> vs. a gradient div.
 */
export function hasDestinationImage(slug: string): boolean {
  return Boolean(DESTINATION_IMAGE_MANIFEST[slug] || UNSPLASH_PHOTO_MAP[slug]);
}

/**
 * Return just the best URL for a slug, or null if nothing is registered.
 * Prefer resolveDestinationImage() when you also need the gradient branch.
 */
export function getDestinationImageUrl(
  slug: string,
  width: number = 800,
  height: number = 600
): string | null {
  const local = DESTINATION_IMAGE_MANIFEST[slug];
  if (local) return local;
  const unsplashId = UNSPLASH_PHOTO_MAP[slug];
  if (unsplashId) return buildUnsplashUrl(unsplashId, width, height);
  return null;
}
