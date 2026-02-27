#!/usr/bin/env node

/**
 * Nassau Knowledge Base Manager
 *
 * Run: node scripts/download-knowledge-base.js
 *
 * This script manages the knowledge base file at src/data/nassau-knowledge-base.json.
 *
 * The knowledge base currently includes 5 destinations with full details:
 *   1. Scottsdale, AZ
 *   2. Myrtle Beach, SC
 *   3. Pinehurst, NC
 *   4. Las Vegas, NV
 *   5. Austin, TX
 *
 * To add more destinations, edit src/data/nassau-knowledge-base.json and add entries
 * to the "destinations" array following the same structure.
 *
 * Remaining destinations to add (15 more):
 *   - San Diego, CA
 *   - Hilton Head, SC
 *   - Pebble Beach, CA
 *   - Kiawah Island, SC
 *   - Bandon Dunes, OR
 *   - Streamsong, FL
 *   - Palm Springs, CA
 *   - Savannah, GA
 *   - Cabo San Lucas, MX
 *   - Branson, MO
 *   - Gulf Shores, AL
 *   - Lake Tahoe, CA/NV
 *   - Mesquite, NV
 *   - Wisconsin Dells / Sand Valley, WI
 *   - St. Andrews, Scotland
 *
 * Each destination needs:
 *   - id, destination, region, nearest_airport
 *   - best_months, avoid_months, vibe_tags, price_tier
 *   - avg_cost_per_person_per_day (budget/mid/premium)
 *   - group_size_sweet_spot, why_go
 *   - top_courses (5-7 with greens fees, ratings, insider tips)
 *   - hidden_gems (2-3 value picks)
 *   - lodging_options (3 tiers)
 *   - dining (4+ restaurants)
 *   - non_golf_activities, insider_tips
 *   - sample_itineraries (at least 1)
 */

const fs = require("fs");
const path = require("path");

const KB_PATH = path.join(__dirname, "..", "src", "data", "nassau-knowledge-base.json");

if (fs.existsSync(KB_PATH)) {
  const kb = JSON.parse(fs.readFileSync(KB_PATH, "utf-8"));
  console.log("Knowledge base exists at:", KB_PATH);
  console.log("Version:", kb.version);
  console.log("Destinations loaded:", kb.destinations?.length || 0);
  console.log(
    "Destinations:",
    (kb.destinations || []).map((d) => d.destination).join(", ")
  );
  console.log(
    "\nTotal courses:",
    (kb.destinations || []).reduce(
      (sum, d) => sum + (d.top_courses?.length || 0) + (d.hidden_gems?.length || 0),
      0
    )
  );
} else {
  console.error("Knowledge base not found at:", KB_PATH);
  console.log("Create it by running the app or copying the template.");
}
