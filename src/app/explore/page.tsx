"use client";

import { useState, useMemo } from "react";

// ============================================
// NASSAU EXPLORE PAGE v2 - Real Photography
// Pinterest-style masonry feed of 50 curated trips
// Photos: Unsplash (Free for commercial use, no attribution required)
// ============================================

// ─── Types ──────────────────────────────────────────────────────

interface TripData {
  id: string;
  dest: string;
  region: string;
  tagline: string;
  vibe: string[];
  tier: string;
  cost: number;
  title: string;
  courses: number;
  nights: number;
  best: string;
  featured?: boolean;
  height: "tall" | "medium" | "short";
}

interface PhotoEntry {
  photo: string;
  fallback: string;
  credit: string;
}

// ─── Photo Map ──────────────────────────────────────────────────

const PHOTO_MAP: Record<string, PhotoEntry> = {
  "scottsdale-az": { photo: "photo-1682686581362-e05e14b37bcb", fallback: "from-amber-600 to-orange-800", credit: "Unsplash" },
  "myrtle-beach-sc": { photo: "photo-1507525428034-b723cf961d3e", fallback: "from-sky-400 to-blue-600", credit: "Unsplash" },
  "pinehurst-nc": { photo: "photo-1587174486073-ae5e5cff23aa", fallback: "from-green-700 to-emerald-900", credit: "Unsplash" },
  "las-vegas-nv": { photo: "photo-1605833556294-ea5c7a74f57d", fallback: "from-purple-600 to-fuchsia-700", credit: "Unsplash" },
  "austin-tx": { photo: "photo-1531218150217-54595bc2b934", fallback: "from-orange-500 to-red-600", credit: "Unsplash" },
  "san-diego-ca": { photo: "photo-1538970272646-f61fabb3a8a2", fallback: "from-cyan-400 to-blue-500", credit: "Unsplash" },
  "hilton-head-sc": { photo: "photo-1535131749006-b7f58c99034b", fallback: "from-teal-500 to-green-600", credit: "Unsplash" },
  "pebble-beach-monterey-ca": { photo: "photo-1587174486073-ae5e5cff23aa", fallback: "from-slate-600 to-blue-900", credit: "T D / Unsplash" },
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

// ─── Trip Data ──────────────────────────────────────────────────

const TRIPS_DATA: TripData[] = [
  { id: "scottsdale-az", dest: "Scottsdale, AZ", region: "Southwest", tagline: "Desert golf + Old Town nightlife", vibe: ["Party", "Resort"], tier: "$$-$$$", cost: 1400, title: "The Scottsdale Classic", courses: 5, nights: 3, best: "Oct-Apr", featured: true, height: "tall" },
  { id: "myrtle-beach-sc", dest: "Myrtle Beach, SC", region: "Southeast", tagline: "80+ courses, endless packages", vibe: ["Budget", "Party"], tier: "$", cost: 600, title: "Grand Strand Marathon", courses: 5, nights: 3, best: "Mar-May", height: "medium" },
  { id: "pinehurst-nc", dest: "Pinehurst, NC", region: "Southeast", tagline: "The cathedral of American golf", vibe: ["Bucket List", "Competitive"], tier: "$$$", cost: 2000, title: "Sandhills Grand Slam", courses: 6, nights: 4, best: "Mar-May", featured: true, height: "tall" },
  { id: "las-vegas-nv", dest: "Las Vegas, NV", region: "Southwest", tagline: "Golf by day, Vegas by night", vibe: ["Party", "Bachelor"], tier: "$$", cost: 1100, title: "Vegas High Roller Open", courses: 5, nights: 3, best: "Oct-Mar", height: "short" },
  { id: "austin-tx", dest: "Austin, TX", region: "South Central", tagline: "BBQ, live music, solid links", vibe: ["Relaxed", "Party"], tier: "$$", cost: 850, title: "Keep Austin Golfing", courses: 4, nights: 3, best: "Oct-Nov", height: "medium" },
  { id: "san-diego-ca", dest: "San Diego, CA", region: "West Coast", tagline: "Year-round perfection on the Pacific", vibe: ["Relaxed", "Bucket List"], tier: "$$", cost: 950, title: "SoCal Coastal Links", courses: 4, nights: 3, best: "Year-round", height: "medium" },
  { id: "hilton-head-sc", dest: "Hilton Head, SC", region: "Southeast", tagline: "Harbour Town and Lowcountry charm", vibe: ["Relaxed", "Corporate"], tier: "$$-$$$", cost: 1200, title: "Lowcountry Invitational", courses: 4, nights: 3, best: "Mar-May", height: "short" },
  { id: "pebble-beach-monterey-ca", dest: "Pebble Beach, CA", region: "West Coast", tagline: "The #1 public course in America", vibe: ["Bucket List"], tier: "$$$$", cost: 3000, title: "Pebble Beach Dream", courses: 4, nights: 3, best: "Apr-Oct", featured: true, height: "tall" },
  { id: "kiawah-island-sc", dest: "Kiawah Island, SC", region: "Southeast", tagline: "The War by the Shore lives on", vibe: ["Bucket List", "Competitive"], tier: "$$$", cost: 1800, title: "Kiawah Ocean Championship", courses: 4, nights: 3, best: "Mar-May", height: "medium" },
  { id: "bandon-dunes-or", dest: "Bandon Dunes, OR", region: "Pacific NW", tagline: "Golf as it was meant to be", vibe: ["Bucket List", "Competitive"], tier: "$$$", cost: 2200, title: "Bandon Pilgrimage", courses: 5, nights: 4, best: "May-Oct", featured: true, height: "tall" },
  { id: "streamsong-fl", dest: "Streamsong, FL", region: "Southeast", tagline: "Three top-100 courses, one resort", vibe: ["Competitive", "Corporate"], tier: "$$$", cost: 1500, title: "Streamsong Triple Crown", courses: 3, nights: 3, best: "Oct-Apr", height: "medium" },
  { id: "palm-springs-ca", dest: "Palm Springs, CA", region: "West Coast", tagline: "Mid-century cool meets desert heat", vibe: ["Relaxed", "Resort"], tier: "$$", cost: 900, title: "Desert Oasis Getaway", courses: 4, nights: 3, best: "Nov-Apr", height: "short" },
  { id: "savannah-ga", dest: "Savannah, GA", region: "Southeast", tagline: "Spanish moss and Southern hospitality", vibe: ["Relaxed", "Father-Son"], tier: "$$", cost: 800, title: "Savannah Gentlemen's Trip", courses: 3, nights: 3, best: "Mar-May", height: "medium" },
  { id: "cabo-san-lucas-mx", dest: "Cabo San Lucas, MX", region: "International", tagline: "Ocean cliffs and tequila sunsets", vibe: ["Party", "Bachelor"], tier: "$$$", cost: 1600, title: "Cabo Classic", courses: 4, nights: 4, best: "Oct-May", height: "tall" },
  { id: "branson-mo", dest: "Branson, MO", region: "Midwest", tagline: "Ozark mountain golf at budget prices", vibe: ["Budget", "Father-Son"], tier: "$", cost: 500, title: "Ozark Mountain Open", courses: 4, nights: 3, best: "Apr-Oct", height: "short" },
  { id: "gulf-shores-al", dest: "Gulf Shores, AL", region: "Gulf Coast", tagline: "White sand beaches, RTJ golf", vibe: ["Budget", "Relaxed"], tier: "$", cost: 550, title: "Gulf Coast Getaway", courses: 4, nights: 3, best: "Mar-May", height: "short" },
  { id: "lake-tahoe-ca", dest: "Lake Tahoe, CA/NV", region: "Mountain West", tagline: "Alpine golf at 6,000 feet", vibe: ["Relaxed", "Scenic"], tier: "$$", cost: 1000, title: "High Sierra Links", courses: 4, nights: 3, best: "Jun-Sep", height: "medium" },
  { id: "mesquite-nv", dest: "Mesquite, NV", region: "Southwest", tagline: "Red rock desert golf, half the Vegas price", vibe: ["Budget", "Competitive"], tier: "$", cost: 550, title: "Desert Value Championship", courses: 4, nights: 3, best: "Oct-Apr", height: "short" },
  { id: "wisconsin-dells-sand-valley-wi", dest: "Sand Valley, WI", region: "Midwest", tagline: "The Bandon of the Midwest", vibe: ["Competitive", "Bucket List"], tier: "$$-$$$", cost: 1300, title: "Sand Valley Quest", courses: 4, nights: 3, best: "May-Sep", height: "medium" },
  { id: "st-andrews-scotland", dest: "St. Andrews, Scotland", region: "International", tagline: "The home of golf", vibe: ["Bucket List"], tier: "$$$$", cost: 3500, title: "St. Andrews Pilgrimage", courses: 4, nights: 5, best: "May-Sep", featured: true, height: "tall" },
  { id: "charleston-sc", dest: "Charleston, SC", region: "Southeast", tagline: "History, Husk, and the Ocean Course", vibe: ["Relaxed", "Corporate"], tier: "$$-$$$", cost: 1200, title: "Charleston Classic", courses: 5, nights: 3, best: "Mar-May", height: "medium" },
  { id: "nashville-tn", dest: "Nashville, TN", region: "Southeast", tagline: "18 holes, 18 honky-tonks", vibe: ["Party", "Bachelor"], tier: "$-$$", cost: 850, title: "Honky-Tonk Open", courses: 4, nights: 3, best: "Apr-May", height: "medium" },
  { id: "destin-fl", dest: "Destin / 30A, FL", region: "Gulf Coast", tagline: "Emerald water, white sand, solid golf", vibe: ["Party", "Relaxed"], tier: "$-$$", cost: 750, title: "Emerald Coast Classic", courses: 4, nights: 3, best: "Mar-May", height: "short" },
  { id: "orlando-fl", dest: "Orlando, FL", region: "Southeast", tagline: "More top courses than you'd expect", vibe: ["Party", "Corporate"], tier: "$$", cost: 900, title: "Orlando Championship Tour", courses: 4, nights: 3, best: "Oct-Mar", height: "medium" },
  { id: "williamsburg-va", dest: "Williamsburg, VA", region: "Mid-Atlantic", tagline: "Colonial charm, championship courses", vibe: ["Father-Son", "Relaxed"], tier: "$$", cost: 800, title: "Colonial Championship", courses: 3, nights: 3, best: "Apr-May", height: "short" },
  { id: "reynolds-lake-oconee-ga", dest: "Reynolds Lake Oconee, GA", region: "Southeast", tagline: "Six courses, one stunning lake", vibe: ["Corporate", "Relaxed"], tier: "$$$", cost: 1500, title: "Lake Oconee Executive Retreat", courses: 4, nights: 3, best: "Mar-May", height: "medium" },
  { id: "rtj-trail-al", dest: "RTJ Trail, AL", region: "Southeast", tagline: "Best golf value in America", vibe: ["Budget", "Competitive"], tier: "$", cost: 650, title: "RTJ Trail Road Trip", courses: 4, nights: 4, best: "Mar-May", featured: true, height: "tall" },
  { id: "cape-cod-ma", dest: "Cape Cod, MA", region: "Northeast", tagline: "Links golf and lobster rolls", vibe: ["Relaxed", "Father-Son"], tier: "$$", cost: 900, title: "Cape Cod Links Tour", courses: 3, nights: 3, best: "Jun-Sep", height: "short" },
  { id: "kohler-wi", dest: "Kohler / Whistling Straits, WI", region: "Midwest", tagline: "Ryder Cup venue on Lake Michigan", vibe: ["Bucket List", "Competitive"], tier: "$$$", cost: 1800, title: "Kohler Grand Slam", courses: 4, nights: 3, best: "May-Sep", featured: true, height: "tall" },
  { id: "tucson-az", dest: "Tucson, AZ", region: "Southwest", tagline: "Scottsdale quality, 30% cheaper", vibe: ["Relaxed", "Father-Son"], tier: "$$", cost: 800, title: "Desert Links Tour", courses: 4, nights: 3, best: "Oct-Apr", height: "short" },
  { id: "bend-or", dest: "Bend, OR", region: "Pacific NW", tagline: "Mountain golf + 30 breweries", vibe: ["Relaxed", "Competitive"], tier: "$$", cost: 950, title: "Bend Brews & Views", courses: 4, nights: 3, best: "Jun-Sep", height: "medium" },
  { id: "park-city-ut", dest: "Park City, UT", region: "Mountain West", tagline: "Ski town summer golf at altitude", vibe: ["Relaxed", "Corporate"], tier: "$$-$$$", cost: 950, title: "Mountain Links & Main Street", courses: 4, nights: 3, best: "Jun-Sep", height: "short" },
  { id: "coeur-dalene-id", dest: "Coeur d'Alene, ID", region: "Pacific NW", tagline: "The famous floating green", vibe: ["Bucket List", "Relaxed"], tier: "$$-$$$", cost: 1100, title: "Lake & Links", courses: 3, nights: 3, best: "Jun-Sep", height: "medium" },
  { id: "amelia-island-fl", dest: "Amelia Island, FL", region: "Southeast", tagline: "Refined island golf without the crowds", vibe: ["Relaxed", "Corporate"], tier: "$$-$$$", cost: 1000, title: "Island Championship", courses: 4, nights: 3, best: "Mar-May", height: "short" },
  { id: "pawleys-island-sc", dest: "Pawleys Island, SC", region: "Southeast", tagline: "Caledonia & True Blue — top 100 gems", vibe: ["Relaxed", "Competitive"], tier: "$$", cost: 850, title: "Lowcountry Links", courses: 4, nights: 3, best: "Mar-May", height: "medium" },
  { id: "sedona-az", dest: "Sedona, AZ", region: "Southwest", tagline: "Red rock golf you'll never forget", vibe: ["Bucket List", "Relaxed"], tier: "$$-$$$", cost: 1100, title: "Red Rock Championship", courses: 3, nights: 3, best: "Mar-May", height: "tall" },
  { id: "french-lick-in", dest: "French Lick, IN", region: "Midwest", tagline: "Pete Dye hilltop masterpiece + casino", vibe: ["Competitive", "Father-Son"], tier: "$$", cost: 900, title: "Hoosier National Championship", courses: 3, nights: 3, best: "May-Oct", height: "short" },
  { id: "atlantic-city-nj", dest: "Atlantic City, NJ", region: "Northeast", tagline: "Links golf and casino nights", vibe: ["Party", "Competitive"], tier: "$$", cost: 900, title: "Shore Links & Casino Nights", courses: 4, nights: 3, best: "May-Oct", height: "medium" },
  { id: "finger-lakes-ny", dest: "Finger Lakes, NY", region: "Northeast", tagline: "Wine country meets fairways", vibe: ["Relaxed", "Father-Son"], tier: "$-$$", cost: 750, title: "Wine Country Links", courses: 4, nights: 3, best: "Jun-Sep", height: "short" },
  { id: "kapalua-maui-hi", dest: "Kapalua, Maui, HI", region: "Hawaii", tagline: "PGA Tour venue meets paradise", vibe: ["Bucket List", "Relaxed"], tier: "$$$$", cost: 2500, title: "Maui Bucket List", courses: 4, nights: 4, best: "Apr-Nov", featured: true, height: "tall" },
  { id: "riviera-maya-mx", dest: "Riviera Maya, MX", region: "International", tagline: "All-inclusive + PGA Tour golf", vibe: ["Party", "Bachelor"], tier: "$$", cost: 1200, title: "Riviera Maya Golf & Beach", courses: 4, nights: 4, best: "Nov-Apr", height: "medium" },
  { id: "punta-cana-dr", dest: "Punta Cana, DR", region: "International", tagline: "Caribbean all-inclusive golf", vibe: ["Party", "Bachelor"], tier: "$$", cost: 1400, title: "Caribbean Championship", courses: 4, nights: 4, best: "Dec-Apr", height: "medium" },
  { id: "algarve-portugal", dest: "Algarve, Portugal", region: "International", tagline: "Europe's premier golf coast", vibe: ["Bucket List", "Corporate"], tier: "$$-$$$", cost: 2000, title: "Algarve Grand Tour", courses: 4, nights: 5, best: "Mar-Jun", height: "tall" },
  { id: "southwest-ireland", dest: "Southwest Ireland", region: "International", tagline: "Links golf, Guinness, and craic", vibe: ["Bucket List", "Competitive"], tier: "$$-$$$", cost: 2200, title: "Wild Atlantic Links", courses: 4, nights: 5, best: "May-Sep", featured: true, height: "tall" },
  { id: "torrey-pines-la-jolla-ca", dest: "Torrey Pines, CA", region: "West Coast", tagline: "US Open venue on the cliffs", vibe: ["Bucket List", "Competitive"], tier: "$$-$$$", cost: 1100, title: "Ocean Cliffs Championship", courses: 3, nights: 3, best: "Sep-Nov", height: "medium" },
  { id: "hershey-pa", dest: "Hershey, PA", region: "Mid-Atlantic", tagline: "Sweet golf in chocolate country", vibe: ["Father-Son", "Relaxed"], tier: "$$", cost: 800, title: "Sweetest Fairways", courses: 4, nights: 3, best: "May-Oct", height: "short" },
  { id: "grand-rapids-mi", dest: "Grand Rapids, MI", region: "Midwest", tagline: "Beer City USA + Arcadia Bluffs", vibe: ["Relaxed", "Competitive"], tier: "$-$$", cost: 800, title: "Beer City Links Tour", courses: 4, nights: 3, best: "Jun-Sep", height: "medium" },
  { id: "ozarks-ar", dest: "Hot Springs, AR", region: "South Central", tagline: "9 courses, $30-60 each. Seriously.", vibe: ["Budget", "Relaxed"], tier: "$", cost: 500, title: "Ozark Value Championship", courses: 4, nights: 3, best: "Mar-May", height: "short" },
  { id: "pinehurst-extended-nc", dest: "Pinehurst (Extended)", region: "Southeast", tagline: "No. 2, No. 4, Tobacco Road — the full Sandhills", vibe: ["Bucket List", "Competitive"], tier: "$$$", cost: 2000, title: "Sandhills Deep Dive", courses: 5, nights: 4, best: "Mar-May", height: "medium" },
  { id: "bethlehem-lehigh-valley-pa", dest: "Bethlehem, PA", region: "Mid-Atlantic", tagline: "Saucon Valley + Steel City vibes", vibe: ["Competitive", "Relaxed"], tier: "$-$$", cost: 600, title: "Steel City Links", courses: 4, nights: 2, best: "May-Oct", height: "short" },
];

// ─── Constants ──────────────────────────────────────────────────

const VIBES = ["All", "Bucket List", "Party", "Relaxed", "Competitive", "Father-Son", "Budget", "Corporate", "Bachelor"];
const REGIONS = ["All", "Southeast", "Southwest", "West Coast", "Midwest", "Pacific NW", "Northeast", "Mid-Atlantic", "International", "Mountain West", "Gulf Coast", "Hawaii", "South Central"];
const PRICES = ["All", "$", "$-$$", "$$", "$$-$$$", "$$$", "$$$$"];

const ACCENT_COLORS: Record<string, string> = {
  "Bucket List": "#0C2E1E",
  Party: "#9C27B0",
  Relaxed: "#00897B",
  Competitive: "#C62828",
  "Father-Son": "#1565C0",
  Budget: "#2E7D32",
  Corporate: "#37474F",
  Bachelor: "#E65100",
  Resort: "#E8751A",
  Scenic: "#0277BD",
};

// ─── Image With Fallback ────────────────────────────────────────

function ImageWithFallback({
  src,
  fallbackGradient,
  alt,
  className,
}: {
  src: string;
  fallbackGradient: string;
  alt: string;
  className: string;
}) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className={`${className} bg-gradient-to-br ${fallbackGradient}`} />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={`${className} object-cover`}
      onError={() => setFailed(true)}
      loading="lazy"
    />
  );
}

// ─── Trip Card ──────────────────────────────────────────────────

function TripCard({
  trip,
  onClick,
}: {
  trip: TripData;
  index: number;
  onClick: (t: TripData) => void;
}) {
  const pm = PHOTO_MAP[trip.id];
  const imgUrl = pm
    ? unsplashUrl(
        pm.photo,
        600,
        trip.height === "tall" ? 500 : trip.height === "medium" ? 380 : 300
      )
    : null;
  const heightClass =
    trip.height === "tall"
      ? "h-96"
      : trip.height === "medium"
        ? "h-72"
        : "h-56";
  const accentColor = ACCENT_COLORS[trip.vibe[0]] || "#0C2E1E";

  return (
    <div
      className="group cursor-pointer break-inside-avoid mb-4"
      onClick={() => onClick(trip)}
    >
      <div className="relative rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 bg-white">
        {/* Photo area */}
        <div className={`relative ${heightClass} overflow-hidden`}>
          {imgUrl ? (
            <ImageWithFallback
              src={imgUrl}
              fallbackGradient={pm?.fallback || "from-gray-500 to-gray-700"}
              alt={trip.dest}
              className="absolute inset-0 w-full h-full group-hover:scale-105 transition-transform duration-700"
            />
          ) : (
            <div
              className={`absolute inset-0 bg-gradient-to-br ${pm?.fallback || "from-gray-500 to-gray-700"}`}
            />
          )}

          {/* Featured badge */}
          {trip.featured && (
            <div
              className="absolute top-3 left-3 bg-amber-400 text-amber-900 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-lg z-10"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              {"⭐"} EDITOR&apos;S PICK
            </div>
          )}

          {/* Price tier badge */}
          <div
            className="absolute top-3 right-3 bg-black/40 backdrop-blur-sm text-white text-xs font-semibold px-2.5 py-1 rounded-full z-10"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            {trip.tier}
          </div>

          {/* Bottom gradient overlay */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-10" />

          {/* Title on image */}
          <div className="absolute bottom-3 left-3 right-3 z-10">
            <h3
              className="text-white text-lg font-bold leading-tight mb-0.5 drop-shadow-lg"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              {trip.title}
            </h3>
            <p
              className="text-white/90 text-sm drop-shadow"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              {trip.dest}
            </p>
          </div>
        </div>

        {/* Content area */}
        <div className="p-3.5">
          <p
            className="text-gray-600 text-sm mb-2.5 leading-snug"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            {trip.tagline}
          </p>

          {/* Stats row */}
          <div
            className="flex items-center gap-3 text-xs text-gray-500 mb-2.5"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            <span>{"🌙"} {trip.nights}N</span>
            <span>{"⛳"} {trip.courses} rounds</span>
            <span>{"📅"} {trip.best}</span>
          </div>

          {/* Vibe tags */}
          <div className="flex flex-wrap gap-1.5">
            {trip.vibe.map((v) => (
              <span
                key={v}
                className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{
                  backgroundColor: `${ACCENT_COLORS[v] || accentColor}12`,
                  color: ACCENT_COLORS[v] || accentColor,
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                {v}
              </span>
            ))}
          </div>

          {/* Cost */}
          <div className="mt-2.5 pt-2.5 border-t border-gray-100 flex items-center justify-between">
            <span
              className="text-xs text-gray-400"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              from
            </span>
            <span
              className="text-base font-bold"
              style={{
                color: "#0C2E1E",
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              ${trip.cost.toLocaleString()}
              <span className="text-xs font-normal text-gray-400">
                /person
              </span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Trip Modal ─────────────────────────────────────────────────

function TripModal({
  trip,
  onClose,
}: {
  trip: TripData;
  onClose: () => void;
}) {
  const pm = PHOTO_MAP[trip.id];
  const imgUrl = pm ? unsplashUrl(pm.photo, 800, 400) : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-t-3xl sm:rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: "slideUp 0.3s ease-out" }}
      >
        {/* Header image */}
        <div className="relative h-52 overflow-hidden rounded-t-3xl sm:rounded-t-2xl">
          {imgUrl ? (
            <ImageWithFallback
              src={imgUrl}
              fallbackGradient={pm?.fallback || "from-gray-500 to-gray-700"}
              alt={trip.dest}
              className="absolute inset-0 w-full h-full"
            />
          ) : (
            <div
              className={`absolute inset-0 bg-gradient-to-br ${pm?.fallback || "from-gray-500 to-gray-700"}`}
            />
          )}
          <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-black/70 to-transparent" />
          <div className="absolute bottom-4 left-5 right-5">
            <h2
              className="text-white text-2xl font-bold drop-shadow-lg"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              {trip.title}
            </h2>
            <p
              className="text-white/80 text-sm mt-1"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              {trip.dest} &middot; {trip.region}
            </p>
          </div>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 bg-black/30 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/50 transition"
          >
            {"✕"}
          </button>
        </div>

        {/* Body */}
        <div className="p-5">
          <p
            className="text-gray-700 text-base leading-relaxed mb-4"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            {trip.tagline}
          </p>

          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            {[
              { label: "Duration", value: `${trip.nights} nights` },
              { label: "Rounds", value: `${trip.courses} courses` },
              { label: "Best Time", value: trip.best },
            ].map((s) => (
              <div
                key={s.label}
                className="bg-gray-50 rounded-xl p-3 text-center"
              >
                <div
                  className="text-xs text-gray-400 mb-1"
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                >
                  {s.label}
                </div>
                <div
                  className="text-sm font-semibold"
                  style={{
                    color: "#0C2E1E",
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  {s.value}
                </div>
              </div>
            ))}
          </div>

          {/* Vibes */}
          <div className="flex flex-wrap gap-2 mb-5">
            {trip.vibe.map((v) => (
              <span
                key={v}
                className="text-sm px-3 py-1 rounded-full font-medium"
                style={{
                  backgroundColor: `${ACCENT_COLORS[v] || "#0C2E1E"}15`,
                  color: ACCENT_COLORS[v] || "#0C2E1E",
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                {v}
              </span>
            ))}
          </div>

          {/* Price */}
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-4 mb-5 border border-emerald-100">
            <div className="flex items-center justify-between">
              <div>
                <div
                  className="text-xs text-emerald-600 font-medium"
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                >
                  Estimated total
                </div>
                <div
                  className="text-2xl font-bold"
                  style={{
                    color: "#0C2E1E",
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  ${trip.cost.toLocaleString()}
                  <span className="text-sm font-normal text-gray-500">
                    {" "}
                    /person
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div
                  className="text-xs text-gray-400"
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                >
                  Price tier
                </div>
                <div
                  className="text-lg font-semibold"
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                >
                  {trip.tier}
                </div>
              </div>
            </div>
          </div>

          {/* CTA */}
          <button
            className="w-full py-3.5 rounded-xl text-white font-bold text-base transition-all duration-200 hover:shadow-lg active:scale-[0.98]"
            style={{
              backgroundColor: "#0C2E1E",
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            Plan This Trip &rarr;
          </button>
          <p
            className="text-center text-xs text-gray-400 mt-2"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            Customize dates, courses & crew after selecting
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────

export default function NassauExplore() {
  const [selectedVibe, setSelectedVibe] = useState("All");
  const [selectedRegion, setSelectedRegion] = useState("All");
  const [selectedPrice, setSelectedPrice] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTrip, setSelectedTrip] = useState<TripData | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const filteredTrips = useMemo(() => {
    return TRIPS_DATA.filter((t) => {
      if (selectedVibe !== "All" && !t.vibe.includes(selectedVibe))
        return false;
      if (selectedRegion !== "All" && t.region !== selectedRegion) return false;
      if (selectedPrice !== "All" && t.tier !== selectedPrice) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          t.dest.toLowerCase().includes(q) ||
          t.title.toLowerCase().includes(q) ||
          t.tagline.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [selectedVibe, selectedRegion, selectedPrice, searchQuery]);

  const activeFilterCount = [selectedVibe, selectedRegion, selectedPrice].filter(
    (f) => f !== "All"
  ).length;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FAFAF8" }}>
      {/* Fonts & animations */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800;900&family=DM+Sans:wght@400;500;600;700&display=swap');
        @keyframes slideUp { from { transform: translateY(100px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .trip-card { animation: fadeIn 0.5s ease-out forwards; opacity: 0; }
        .masonry { column-count: 2; column-gap: 16px; }
        @media (min-width: 768px) { .masonry { column-count: 3; } }
        @media (min-width: 1024px) { .masonry { column-count: 4; } }
        @media (max-width: 640px) { .masonry { column-count: 1; } }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: "#0C2E1E" }}
            >
              <span
                className="text-white text-sm font-bold"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                N
              </span>
            </div>
            <span
              className="text-lg font-bold"
              style={{
                color: "#0C2E1E",
                fontFamily: "'Playfair Display', serif",
              }}
            >
              Nassau
            </span>
          </div>

          {/* Search */}
          <div className="flex-1 max-w-md mx-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search destinations, trips..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-100 rounded-full px-4 py-2 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 transition"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              />
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                {"🔍"}
              </span>
            </div>
          </div>

          <button
            className="px-4 py-2 rounded-full text-sm font-semibold text-white transition hover:shadow-lg hidden sm:block"
            style={{
              backgroundColor: "#0C2E1E",
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            Plan a Trip
          </button>
        </div>
      </header>

      {/* HERO */}
      <div className="max-w-7xl mx-auto px-4 pt-8 pb-4">
        <h1
          className="text-3xl sm:text-4xl font-black mb-2"
          style={{
            color: "#0C2E1E",
            fontFamily: "'Playfair Display', serif",
          }}
        >
          Explore Golf Trips
        </h1>
        <p
          className="text-gray-500 text-base max-w-xl"
          style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
          50 curated trips across 50 destinations. Find your next round, or let
          us plan one for you.
        </p>
      </div>

      {/* FILTER BAR */}
      <div className="max-w-7xl mx-auto px-4 pb-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {/* Filter toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-semibold border-2 transition whitespace-nowrap"
            style={{
              borderColor: activeFilterCount > 0 ? "#0C2E1E" : "#E5E7EB",
              backgroundColor: activeFilterCount > 0 ? "#0C2E1E" : "white",
              color: activeFilterCount > 0 ? "white" : "#374151",
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            {"☰"} Filters{" "}
            {activeFilterCount > 0 && (
              <span className="bg-white text-emerald-900 w-5 h-5 rounded-full text-xs flex items-center justify-center font-bold">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Quick vibe pills */}
          {VIBES.slice(1).map((v) => (
            <button
              key={v}
              onClick={() =>
                setSelectedVibe(selectedVibe === v ? "All" : v)
              }
              className="px-3.5 py-2 rounded-full text-sm font-medium border transition whitespace-nowrap"
              style={{
                borderColor: selectedVibe === v ? "#0C2E1E" : "#E5E7EB",
                backgroundColor: selectedVibe === v ? "#0C2E1E" : "white",
                color: selectedVibe === v ? "white" : "#6B7280",
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              {v}
            </button>
          ))}
        </div>

        {/* Expanded filters */}
        {showFilters && (
          <div
            className="mt-3 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm"
            style={{ animation: "fadeIn 0.2s ease-out" }}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  className="text-xs font-semibold text-gray-400 mb-2 block"
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                >
                  REGION
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {REGIONS.map((r) => (
                    <button
                      key={r}
                      onClick={() => setSelectedRegion(r)}
                      className="px-2.5 py-1 rounded-full text-xs font-medium border transition"
                      style={{
                        borderColor:
                          selectedRegion === r ? "#0C2E1E" : "#E5E7EB",
                        backgroundColor:
                          selectedRegion === r ? "#0C2E1E" : "transparent",
                        color: selectedRegion === r ? "white" : "#6B7280",
                        fontFamily: "'DM Sans', sans-serif",
                      }}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label
                  className="text-xs font-semibold text-gray-400 mb-2 block"
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                >
                  PRICE
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {PRICES.map((p) => (
                    <button
                      key={p}
                      onClick={() => setSelectedPrice(p)}
                      className="px-2.5 py-1 rounded-full text-xs font-medium border transition"
                      style={{
                        borderColor:
                          selectedPrice === p ? "#0C2E1E" : "#E5E7EB",
                        backgroundColor:
                          selectedPrice === p ? "#0C2E1E" : "transparent",
                        color: selectedPrice === p ? "white" : "#6B7280",
                        fontFamily: "'DM Sans', sans-serif",
                      }}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {activeFilterCount > 0 && (
              <button
                onClick={() => {
                  setSelectedVibe("All");
                  setSelectedRegion("All");
                  setSelectedPrice("All");
                }}
                className="mt-3 text-xs text-gray-400 hover:text-gray-600 underline"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                Clear all filters
              </button>
            )}
          </div>
        )}

        {/* Results count */}
        <div
          className="mt-3 text-sm text-gray-400"
          style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
          {filteredTrips.length} trip{filteredTrips.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* MASONRY GRID */}
      <div className="max-w-7xl mx-auto px-4 pb-16">
        <div className="masonry">
          {filteredTrips.map((trip, i) => (
            <div
              key={trip.id}
              className="trip-card"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <TripCard trip={trip} index={i} onClick={setSelectedTrip} />
            </div>
          ))}
        </div>

        {filteredTrips.length === 0 && (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">{"🏌️‍♂️"}</div>
            <h3
              className="text-xl font-bold mb-2"
              style={{
                color: "#0C2E1E",
                fontFamily: "'Playfair Display', serif",
              }}
            >
              No trips match those filters
            </h3>
            <p
              className="text-gray-400 text-sm"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              Try adjusting your filters or search query
            </p>
            <button
              onClick={() => {
                setSelectedVibe("All");
                setSelectedRegion("All");
                setSelectedPrice("All");
                setSearchQuery("");
              }}
              className="mt-4 px-5 py-2 rounded-full text-sm font-semibold text-white"
              style={{
                backgroundColor: "#0C2E1E",
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* BOTTOM CTA */}
      <div
        className="border-t border-gray-100 py-12"
        style={{ backgroundColor: "#0C2E1E" }}
      >
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2
            className="text-2xl sm:text-3xl font-bold text-white mb-3"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Don&apos;t see your perfect trip?
          </h2>
          <p
            className="text-emerald-200/80 text-sm mb-6 max-w-md mx-auto"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            Tell Nassau what you&apos;re looking for and our expertly trained
            trip advisor will build a custom trip in under 60 seconds.
          </p>
          <a
            href="/trips/create/ai"
            className="inline-block px-8 py-3.5 rounded-full text-base font-bold transition hover:shadow-xl"
            style={{
              backgroundColor: "#D4A843",
              color: "#0C2E1E",
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            Plan My Trip {"✨"}
          </a>
        </div>
      </div>

      {/* MODAL */}
      {selectedTrip && (
        <TripModal
          trip={selectedTrip}
          onClose={() => setSelectedTrip(null)}
        />
      )}
    </div>
  );
}
