// scripts/enrichment-prompt.js
// Prompt template for Claude API enrichment of KB destinations. v3.

const REGION_VISUAL_MAP = {
  'Pacific Northwest': 'PNW',
  'West Coast': 'West',
  'Pacific': 'West',
  'Southwest': 'Southwest',
  'Southeast': 'Southeast',
  'Northeast': 'Northeast',
  'Mid-Atlantic': 'Northeast',
  'Midwest': 'Midwest',
  'Mountain West': 'Mountain',
  'Mountain': 'Mountain',
  'South Central': 'Southeast',
  'Gulf Coast': 'Southeast',
  'Hawaii': 'Tropical',
  'International': 'International',
};

function buildPrompt(destination, tripStructureRules) {
  const midDailyCost = (destination.avg_cost_per_person_per_day || {}).mid || 500;
  const sampleEstCost = (destination.sample_itineraries || {})['4_day_pilgrimage']?.estimated_cost_pp
    || (destination.sample_itineraries && Object.values(destination.sample_itineraries)[0]?.estimated_cost_pp)
    || (midDailyCost * 4);
  const sampleNights = (destination.sample_itineraries || {})['4_day_pilgrimage']?.duration_nights
    || (destination.sample_itineraries && Object.values(destination.sample_itineraries)[0]?.duration_nights)
    || 3;

  const topCourseNames = (destination.top_courses || []).map(c => c.name);
  const hasCaddies = (destination.top_courses || []).some(c => c.caddie_available === true);
  const totalCourses = topCourseNames.length;

  return `You are helping enrich a golf-trip destination entry for Nassau, a marketplace where captains buy "golf trips in a box" for $29.

Each kit auto-creates a working trip in the Nassau app. The captain doesn't research — he executes. Your enrichment is the difference between "PDF I read once" and "trip I actually run."

VOICE GUIDELINES (CRITICAL):
- Dry, declarative, captain-to-captain
- No marketing hype, no exclamation marks, no emojis
- Specific over abstract ("play Pacific Dunes day 2 morning before wind picks up", not "consider playing Pacific Dunes")
- Confidence without sales-speak

EXAMPLES OF THE VOICE FROM THIS DESTINATION'S OWN INSIDER TIPS (mirror this tone):
${(destination.insider_tips || []).map(t => `- "${t}"`).join('\n')}

═══════════════════════════════════════════════════════════════
DESTINATION DATA (existing KB)
═══════════════════════════════════════════════════════════════
${JSON.stringify(destination, null, 2)}

═══════════════════════════════════════════════════════════════
TRIP STRUCTURE RULES (apply these to the itinerary)
═══════════════════════════════════════════════════════════════
${JSON.stringify(tripStructureRules, null, 2)}

═══════════════════════════════════════════════════════════════
COST ANCHOR (USE THESE EXACT NUMBERS AS YOUR BASELINE)
═══════════════════════════════════════════════════════════════
- This destination's mid-tier daily cost per person: $${midDailyCost}
- Sample itinerary estimated total cost per person: $${sampleEstCost}
- Sample itinerary number of lodging nights: ${sampleNights}
- Your cost_breakdown_4day MUST sum to within plus-or-minus 10% of $${sampleEstCost}.
- Apply this budget allocation logic from trip_structure_rules:
  - golf (green fees): 35-45% of total
  - lodging: 25-35% of total (over ${sampleNights} nights, NOT 4 nights)
  - food/drink: 15-20% of total
  - transportation (ground): 5-10% of total
  - entertainment/caddies/tips: 5-10% of total
${hasCaddies ? `
- THIS DESTINATION HAS CADDIES (at least one course has caddie_available=true).
- "Caddies + tips" line item MUST be a positive number, NOT zero.
- Standard math: (number_of_rounds_with_caddies × $80 per player share) + 20% tip.
- For a typical trip: ~$200-$500 in caddies + tips per person, depending on round count.` : `
- This destination does NOT have caddies on most courses. The "caddies + tips" line should be replaced with "Cart fees" or similar non-zero line item, OR removed entirely if not relevant.`}

═══════════════════════════════════════════════════════════════
COURSE COVERAGE REQUIREMENT
═══════════════════════════════════════════════════════════════
This destination has ${totalCourses} courses in top_courses:
${topCourseNames.map((n, i) => `  ${i + 1}. ${n}`).join('\n')}

CRITICAL: Every course listed above MUST appear in your recommended_itinerary at least once. Do not drop any course. If the trip is too short to fit them all, prioritize the highest condition_rating + scenery_rating courses, and include the others on multi-round days (Bandon-style 36-hole stretches) or extend the trip duration.

For trips with multiple rounds per day, label entries as "Day N (AM)" and "Day N (PM)" with separate entries sharing the same day number.

═══════════════════════════════════════════════════════════════
YOUR TASK
═══════════════════════════════════════════════════════════════
Generate a JSON object with exactly these fields. Do not include any prose, only the JSON object.

{
  "kit_title": "string — 4-7 words, evocative, captures the trip's identity. Should be unique to this specific destination's vibe and region. DO NOT use generic titles like 'The Bucket List Trip' or 'The Premium Experience'. Make it feel like THIS place.",

  "kit_subtitle": "string — format: 'X days · Y rounds · all-in ~\$Z/pp'. Z must equal the SUM of your cost_breakdown_4day below, rounded to the nearest \$100. X = ${sampleNights + 1} (full days of trip). Y = total rounds in your recommended_itinerary (count entries with non-null tee_time and a real course_id, not 'Travel' entries).",

  "kit_tagline": "string — single sentence, 120 chars or less. The captain's pitch in his own words for THIS specific destination. Reference the destination's actual character (vibe tags, region, signature feature). DO NOT use generic golf-trip phrases like 'world-class courses' or 'bucket list' or 'trip of a lifetime'.",

  "region_visual_category": "string — one of: PNW, West, Southwest, Southeast, Northeast, Midwest, Mountain, Tropical, International",

  "default_recommended_dates": {
    "start": "YYYY-MM-DD format, pick a Monday in 2026 from best_months (prefer mid-month, avoid US holidays)",
    "end": "YYYY-MM-DD format, calculated based on duration_nights (${sampleNights} nights = checkout on day ${sampleNights + 1})",
    "reason": "string — 1 sentence explaining why these dates. Reference weather, pricing, or events to avoid."
  },

  "recommended_itinerary": [
    {
      "day": 1,
      "day_label": "Day 1",
      "course_id": "course name from top_courses (or hidden_gem for arrival), or 'Travel + Range' for arrival days, or 'Travel' for departure",
      "tee_time": "HH:MM AM/PM format, or null for travel/rest",
      "tee_time_logic": "string — 1 sentence explaining why this slot. Use weather, course difficulty, energy level, etc."
    }
  ],

  "recommended_lodging": {
    "name": "string — exact name from lodging_options",
    "room_type": "string — specific room type if known, otherwise empty string",
    "nightly_rate": "number — pick from per_night_range, midpoint",
    "why_this_one": "string — 1-2 sentences in captain voice. Reference what specifically about this lodging makes it the right pick.",
    "booking_priority": "string — 'Critical · X months out' or similar. Reference any insider_tips about booking windows."
  },

  "cost_breakdown_4day": [
    { "item": "Green fees (X rounds)", "amount": 0 },
    { "item": "Lodging (X nights)", "amount": 0 },
    ${hasCaddies ? `{ "item": "Caddies + tips", "amount": 0 },` : `{ "item": "Cart fees + range", "amount": 0 },`}
    { "item": "Food + drink", "amount": 0 },
    { "item": "Travel + transfer", "amount": 0 }
  ],

  "bonus_plays": [
    {
      "type": "dinner|putting|9-hole|bar|range|other",
      "name": "string",
      "why": "string — captain voice, specific reason, 1-2 sentences",
      "when": "string — Day X evening, anytime, before flights, etc."
    }
  ]
}

CRITICAL CONSTRAINTS (verify each before finalizing):
- Output ONLY valid JSON. No markdown code fences. No prose before or after.
- Do not invent courses, lodging, or restaurants. Use what's in the existing destination data.
- Match the captain voice exactly. Read the insider_tips above and mirror their tone.
- For numeric fields, use real numbers (not strings).
- Use ${sampleNights} nights of lodging, NOT 4. The trip duration is ${sampleNights + 1} days.
- The cost_breakdown_4day total MUST be within 10% of \$${sampleEstCost}.
- The kit_subtitle's "all-in ~\$Z/pp" MUST equal the sum of your cost_breakdown_4day, rounded to nearest \$100.
- The kit_tagline must be specific to THIS destination, not a generic golf phrase.
${hasCaddies ? `- The "Caddies + tips" amount MUST be > 0 since this destination has caddies.` : ''}
- Every course in top_courses MUST appear in recommended_itinerary at least once.
`;
}

module.exports = { buildPrompt, REGION_VISUAL_MAP };
