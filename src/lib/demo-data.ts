// ---------------------------------------------------------------------------
// Demo seed data — Bandon Dunes 2026 trip
// Edit names, scores, and amounts here to change what appears on /demo pages.
// ---------------------------------------------------------------------------

// ── Crew ──────────────────────────────────────────────────────────────────────
export const DEMO_CREW = [
  { id: "p1", name: "Grayson Frank", handicap: 12, nickname: "The Captain", role: "captain" as const },
  { id: "p2", name: "Tyler Whitman", handicap: 8, nickname: "The Closer", role: "member" as const },
  { id: "p3", name: "Jake Morrison", handicap: 14, nickname: "The Sandbagger", role: "member" as const },
  { id: "p4", name: "Marcus Chen", handicap: 11, nickname: "The Banker", role: "member" as const },
  { id: "p5", name: "Ben Rodriguez", handicap: 18, nickname: "The Optimist", role: "member" as const },
  { id: "p6", name: "Cole Davis", handicap: 6, nickname: "The Ringer", role: "member" as const },
];

export function getCrewName(id: string): string {
  return DEMO_CREW.find((c) => c.id === id)?.name ?? "Unknown";
}

// ── Trip ──────────────────────────────────────────────────────────────────────
export const DEMO_TRIP = {
  id: "demo-trip-1",
  name: "Bandon Dunes 2026 — The Annual",
  destination: "Bandon, Oregon",
  startDate: "2026-05-08",
  endDate: "2026-05-11",
  shareCode: "BANDON26",
  costPerPerson: 2847,
  lodging: "Lily Pond Cottage at Bandon Dunes Resort",
  status: "in_progress" as const,
  captainId: "p1",
};

// ── Rounds ────────────────────────────────────────────────────────────────────
export const DEMO_ROUNDS = [
  { id: "r1", courseName: "Bandon Dunes", date: "2026-05-09", par: 72, status: "completed" as const },
  { id: "r2", courseName: "Pacific Dunes", date: "2026-05-10", par: 71, status: "completed" as const },
  { id: "r3", courseName: "Old Macdonald", date: "2026-05-11", par: 72, status: "scheduled" as const },
];

// ── Round 1 Scores (Bandon Dunes — par 72) ────────────────────────────────────
export const DEMO_ROUND1_RESULTS = [
  { playerId: "p6", total: 75, skins: 4 },
  { playerId: "p2", total: 79, skins: 3 },
  { playerId: "p1", total: 83, skins: 2 },
  { playerId: "p4", total: 85, skins: 1 },
  { playerId: "p3", total: 88, skins: 0 },
  { playerId: "p5", total: 92, skins: 0 },
];

// ── Round 2 Scores (Pacific Dunes — par 71) ───────────────────────────────────
export const DEMO_ROUND2_RESULTS = [
  { playerId: "p6", total: 73, skins: 3 },
  { playerId: "p2", total: 78, skins: 2 },
  { playerId: "p4", total: 81, skins: 2 },
  { playerId: "p1", total: 84, skins: 1 },
  { playerId: "p3", total: 86, skins: 1 },
  { playerId: "p5", total: 91, skins: 0 },
];

// ── Pacific Dunes Scorecard (hole-by-hole for Round 2) ────────────────────────
export const PACIFIC_DUNES_PARS = [4, 4, 3, 4, 3, 5, 4, 4, 4, 4, 3, 4, 3, 5, 4, 4, 4, 5];

export const DEMO_SCORECARD_PLAYERS = [
  { id: "p6", name: "Cole Davis", handicap: 6,
    scores: [4, 4, 3, 4, 3, 5, 4, 4, 4, 4, 4, 4, 3, 5, 4, 5, 4, 5] as (number | null)[] },
  { id: "p2", name: "Tyler Whitman", handicap: 8,
    scores: [4, 5, 3, 5, 4, 5, 4, 4, 4, 4, 4, 5, 3, 5, 5, 4, 5, 5] as (number | null)[] },
  { id: "p4", name: "Marcus Chen", handicap: 11,
    scores: [5, 4, 4, 5, 4, 3, 5, 5, 5, 4, 4, 5, 3, 6, 4, 5, 4, 6] as (number | null)[] },
  { id: "p1", name: "Grayson Frank", handicap: 12,
    scores: [5, 5, 4, 4, 4, 6, 4, 5, 5, 5, 3, 5, 4, 5, 4, 5, 5, 6] as (number | null)[] },
  { id: "p3", name: "Jake Morrison", handicap: 14,
    scores: [5, 5, 4, 5, 4, 6, 5, 4, 5, 5, 4, 5, 3, 6, 5, 4, 5, 6] as (number | null)[] },
  { id: "p5", name: "Ben Rodriguez", handicap: 18,
    scores: [6, 5, 4, 6, 4, 6, 5, 5, 5, 5, 4, 5, 4, 6, 5, 5, 5, 6] as (number | null)[] },
];

// ── Skins (Round 2, $10/skin) ─────────────────────────────────────────────────
export const DEMO_SKINS = {
  buyIn: 10,
  holes: [
    { hole: 1, winnerId: "p6" },
    { hole: 6, winnerId: "p4" },   // Marcus eagle
    { hole: 11, winnerId: "p1" },
    { hole: 13, winnerId: "p6" },
    { hole: 3, winnerId: "p2" },
    { hole: 8, winnerId: "p6" },
    { hole: 10, winnerId: "p2" },
    { hole: 15, winnerId: "p3" },
    { hole: 4, winnerId: "p4" },
  ],
  payouts: { p6: 30, p2: 20, p4: 20, p1: 10, p3: 10, p5: 0 } as Record<string, number>,
};

// ── Nassau Bets ($20/side, $40/match) ─────────────────────────────────────────
export const DEMO_NASSAU = {
  betAmount: 20,
  round2: {
    frontNine: { winnerId: "p6", scores: { p6: 35, p2: 38, p4: 40, p1: 42, p3: 43, p5: 46 } },
    backNine: { winnerId: "p6", scores: { p6: 38, p2: 40, p4: 41, p1: 42, p3: 43, p5: 45 } },
    overall: { winnerId: "p6", scores: { p6: 73, p2: 78, p4: 81, p1: 84, p3: 86, p5: 91 } },
  },
};

// ── Settlements (across rounds 1 + 2) ─────────────────────────────────────────
export const DEMO_SETTLEMENTS = [
  { id: "s1", fromId: "p2", toId: "p1", amount: 35, note: "Nassau bet — Round 1", status: "pending" as const },
  { id: "s2", fromId: "p3", toId: "p6", amount: 47, note: "Skins debt — Rounds 1-2", status: "pending" as const },
  { id: "s3", fromId: "p5", toId: "p4", amount: 62, note: "Nassau back 9 + skins", status: "pending" as const },
  { id: "s4", fromId: "p5", toId: "p6", amount: 28, note: "Nassau total — Round 2", status: "pending" as const },
  { id: "s5", fromId: "p3", toId: "p2", amount: 20, note: "Nassau front 9 — Round 2", status: "pending" as const },
];

export const DEMO_SETTLEMENTS_TOTAL = 192;

// ── Itinerary ─────────────────────────────────────────────────────────────────
export const DEMO_ITINERARY = [
  { date: "2026-05-08", title: "Travel Day", type: "travel" as const, detail: "Arrive Bandon" },
  { date: "2026-05-08", title: "Group Dinner — Pacific Grill", type: "dinner" as const, detail: "7:00 PM" },
  { date: "2026-05-09", title: "Bandon Dunes — Round 1", type: "tee_time" as const, detail: "8:30 AM" },
  { date: "2026-05-09", title: "Dinner — McKenzie's Pub", type: "dinner" as const, detail: "6:30 PM" },
  { date: "2026-05-10", title: "Pacific Dunes — Round 2", type: "tee_time" as const, detail: "9:00 AM" },
  { date: "2026-05-10", title: "Drinks — The Bunker Bar", type: "dinner" as const, detail: "7:00 PM" },
  { date: "2026-05-11", title: "Old Macdonald — Round 3", type: "tee_time" as const, detail: "8:00 AM" },
  { date: "2026-05-11", title: "Travel Home", type: "travel" as const, detail: "Depart 3 PM" },
];

// ── Awards (Round 2) ──────────────────────────────────────────────────────────
export const DEMO_AWARDS = [
  { title: "Low Round", playerId: "p6", playerName: "Cole Davis", description: "73 — 2 over par" },
  { title: "Money Player", playerId: "p6", playerName: "Cole Davis", description: "Won $50 total" },
  { title: "Comeback Kid", playerId: "p4", playerName: "Marcus Chen", description: "Eagle on par-5 6th" },
  { title: "Steady Eddie", playerId: "p2", playerName: "Tyler Whitman", description: "78 — consistent round" },
];

// ── Combined Leaderboard (Rounds 1 + 2) ───────────────────────────────────────
export const DEMO_STANDINGS = [
  { playerId: "p6", name: "Cole Davis", totalStrokes: 148, totalPar: 143, skins: 7, moneyNet: 105 },
  { playerId: "p2", name: "Tyler Whitman", totalStrokes: 157, totalPar: 143, skins: 5, moneyNet: 15 },
  { playerId: "p1", name: "Grayson Frank", totalStrokes: 167, totalPar: 143, skins: 3, moneyNet: -5 },
  { playerId: "p4", name: "Marcus Chen", totalStrokes: 166, totalPar: 143, skins: 3, moneyNet: 12 },
  { playerId: "p3", name: "Jake Morrison", totalStrokes: 174, totalPar: 143, skins: 1, moneyNet: -67 },
  { playerId: "p5", name: "Ben Rodriguez", totalStrokes: 183, totalPar: 143, skins: 0, moneyNet: -90 },
];

// ── Planning / Pre-trip Data ─────────────────────────────────────────────────

export const DEMO_LODGING = {
  name: "Lily Pond Cottage at Bandon Dunes Resort",
  perNight: 487,
  nights: 3,
  status: "Booked" as const,
};

export const DEMO_TEE_TIMES = [
  { course: "Bandon Dunes", date: "2026-05-09", time: "8:30 AM", status: "Tee times confirmed" as const },
  { course: "Pacific Dunes", date: "2026-05-10", time: "9:00 AM", status: "Tee times confirmed" as const },
  { course: "Old Macdonald", date: "2026-05-11", time: "8:00 AM", status: "Tee times confirmed" as const },
];

export const DEMO_CREW_CONTRIBUTIONS = {
  total: 14235,
  perPerson: 2847,
  status: "Fully funded" as const,
};

export const DEMO_INVITE_STATUS = [
  { playerId: "p1", name: "Grayson Frank", status: "captain" as const },
  { playerId: "p2", name: "Tyler Whitman", status: "committed" as const },
  { playerId: "p6", name: "Cole Davis", status: "committed" as const },
  { playerId: "p4", name: "Marcus Chen", status: "committed" as const },
  { playerId: "p3", name: "Jake Morrison", status: "pending" as const },
  { playerId: "p5", name: "Ben Rodriguez", status: "pending" as const },
];

export const DEMO_PLANNING_ITINERARY = [
  { day: 1, label: "Day 1 — Thu, May 8", items: [
    { time: "2:00 PM", title: "Arrive Bandon — Southwest Oregon Regional", type: "travel" as const },
    { time: "4:00 PM", title: "Check in — Lily Pond Cottage", type: "activity" as const },
    { time: "7:00 PM", title: "Group Dinner — Pacific Grill", type: "dinner" as const },
  ]},
  { day: 2, label: "Day 2 — Fri, May 9", items: [
    { time: "8:30 AM", title: "Round 1 — Bandon Dunes (Par 72)", type: "tee_time" as const },
    { time: "2:00 PM", title: "Free time — Punchbowl putting course", type: "activity" as const },
    { time: "6:30 PM", title: "Dinner — McKenzie's Pub", type: "dinner" as const },
  ]},
  { day: 3, label: "Day 3 — Sat, May 10", items: [
    { time: "9:00 AM", title: "Round 2 — Pacific Dunes (Par 71)", type: "tee_time" as const },
    { time: "3:00 PM", title: "Drinks — The Bunker Bar", type: "activity" as const },
    { time: "7:00 PM", title: "Captain's Dinner — The Gallery", type: "dinner" as const },
  ]},
  { day: 4, label: "Day 4 — Sun, May 11", items: [
    { time: "8:00 AM", title: "Round 3 — Old Macdonald (Par 72)", type: "tee_time" as const },
    { time: "1:00 PM", title: "Awards & Settlements", type: "activity" as const },
    { time: "3:00 PM", title: "Depart Bandon", type: "travel" as const },
  ]},
];

export const DEMO_DESTINATIONS = [
  { name: "Bandon Dunes, OR", slug: "bandon-dunes-or", price: "from $3,200", info: "3N · 4 rounds" },
  { name: "Pinehurst, NC", slug: "pinehurst-nc", price: "from $2,200", info: "3N · 3 rounds" },
  { name: "Scottsdale, AZ", slug: "scottsdale-az", price: "from $1,650", info: "3N · 3 rounds" },
  { name: "Myrtle Beach, SC", slug: "myrtle-beach-sc", price: "from $850", info: "3N · 4 rounds" },
  { name: "Pebble Beach, CA", slug: "pebble-beach-ca", price: "from $3,500", info: "3N · 3 rounds" },
  { name: "St. Andrews, Scotland", slug: "st-andrews-scotland", price: "from $5,000", info: "4N · 3 rounds" },
  { name: "Streamsong, FL", slug: "streamsong-fl", price: "from $1,800", info: "3N · 3 rounds" },
  { name: "Sand Valley, WI", slug: "sand-valley-wi", price: "from $1,400", info: "2N · 3 rounds" },
  { name: "Kiawah Island, SC", slug: "kiawah-island-sc", price: "from $2,600", info: "3N · 3 rounds" },
  { name: "Kohler, WI", slug: "kohler-wi", price: "from $2,100", info: "2N · 3 rounds" },
  { name: "Reynolds Lake Oconee, GA", slug: "reynolds-lake-oconee-ga", price: "from $1,500", info: "3N · 4 rounds" },
  { name: "Cabo San Lucas, MX", slug: "cabo-san-lucas-mx", price: "from $2,800", info: "3N · 3 rounds" },
  { name: "Kapalua, Maui, HI", slug: "kapalua-maui-hi", price: "from $3,800", info: "4N · 3 rounds" },
  { name: "Palm Springs, CA", slug: "palm-springs-ca", price: "from $1,200", info: "3N · 4 rounds" },
  { name: "Hilton Head, SC", slug: "hilton-head-sc", price: "from $1,100", info: "3N · 3 rounds" },
];
