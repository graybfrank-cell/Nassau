import { NextRequest, NextResponse } from "next/server";
import { getUser, unauthorized } from "@/lib/auth";
import fs from "fs";
import path from "path";

// Allow up to 60s for this function (Claude API can take 15-25s)
export const maxDuration = 60;

/* ─── Types ───────────────────────────────────────────────── */

interface Preferences {
  vibe: string;
  group_size: number;
  budget_tier: string;
  dates: {
    start_date?: string;
    end_date?: string;
    season?: string;
    flexible: boolean;
  };
  priorities: string[];
  notes?: string;
}

interface ConceptsRequest {
  stage: "concepts";
  preferences: Preferences;
}

interface FollowupRequest {
  stage: "followup";
  original_preferences: Preferences;
  selected_concepts: { id: string; concept_name: string; destination: string; destination_id: string }[];
}

interface BuildRequest {
  stage: "build";
  original_preferences: Preferences;
  selected_concept: { concept_name: string; destination: string; destination_id: string };
  followup_answers: Record<string, string>;
}

type IdeateRequest = ConceptsRequest | FollowupRequest | BuildRequest;

/* ─── Scoring Maps ────────────────────────────────────────── */

const VIBE_TO_KB_TAGS: Record<string, string[]> = {
  competitive: ["golf-purist", "traditional", "bucket-list", "walking-only"],
  party: ["nightlife", "bachelor-party-friendly", "live-music", "entertainment", "casino"],
  relaxed: ["relaxed", "laid-back", "coastal", "beach", "scenic"],
  "father-son": ["father-son", "traditional", "bucket-list", "historic"],
  corporate: ["resort", "premium", "luxury"],
  "bucket-list": ["bucket-list", "once-in-a-lifetime", "special-occasion", "international"],
};

const BUDGET_TO_KB_TIERS: Record<string, string[]> = {
  budget: ["budget"],
  mid: ["budget", "mid"],
  premium: ["mid", "mid-high", "premium"],
  luxury: ["premium", "mid-high", "luxury"],
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const PRIORITY_MATCHES: Record<string, (d: any) => boolean> = {
  "Elite courses": (d) =>
    d.top_courses?.some(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (c: any) => (c.condition_rating ?? 0) >= 4.5 || (c.scenery_rating ?? 0) >= 4.5
    ) ?? false,
  "Great food scene": (d) => (d.dining?.length ?? 0) >= 4 || d.vibe?.includes("food-scene"),
  "Beach access": (d) =>
    d.vibe?.includes("beach") || d.vibe?.includes("coastal") || d.vibe?.includes("ocean") || d.destination?.toLowerCase().includes("beach"),
  "Nightlife": (d) =>
    d.vibe?.includes("nightlife") || d.vibe?.includes("entertainment") || d.vibe?.includes("bachelor-party-friendly"),
  "Best value": (d) => d.price_tier === "budget" || d.vibe?.includes("budget-friendly"),
  "Perfect weather": (d) => d.region === "Southwest" || d.region === "Desert" || d.region === "Mexico",
  "Scenic beauty": (d) =>
    d.vibe?.includes("scenic") || d.vibe?.includes("ocean") || d.vibe?.includes("mountain") || d.vibe?.includes("Ozark-scenery"),
  "Craft beer/bourbon": (d) =>
    d.vibe?.includes("bourbon-trail") || d.vibe?.includes("live-music") || d.destination?.includes("Austin") || d.destination?.includes("Savannah"),
  "Casino/entertainment": (d) =>
    d.vibe?.includes("casino") || d.vibe?.includes("entertainment") || d.destination?.includes("Las Vegas"),
  "Off the beaten path": (d) =>
    d.vibe?.includes("hidden-gem") || d.vibe?.includes("hidden-gem-vibe") || d.vibe?.includes("midwest-getaway") ||
    d.destination?.includes("Bandon") || d.destination?.includes("Streamsong") || d.destination?.includes("Sand Valley"),
};

/* ─── Knowledge Base ──────────────────────────────────────── */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _knowledgeBase: any = null;
function getKnowledgeBase() {
  if (_knowledgeBase) return _knowledgeBase;
  try {
    const filePath = path.join(process.cwd(), "src/data/nassau-knowledge-base.json");
    const raw = fs.readFileSync(filePath, "utf-8");
    _knowledgeBase = JSON.parse(raw);
    console.log("[AI Ideate] Knowledge base loaded:", _knowledgeBase.destinations?.length, "destinations");
    return _knowledgeBase;
  } catch (err) {
    console.error("[AI Ideate] Failed to load knowledge base:", err);
    return null;
  }
}

/* ─── Scoring ─────────────────────────────────────────────── */

function getMonthAbbrev(dateStr: string): string | null {
  try {
    const date = new Date(dateStr + "T12:00:00");
    return date.toLocaleString("en-US", { month: "short" });
  } catch {
    return null;
  }
}

function seasonToMonths(season: string): string[] {
  const map: Record<string, string[]> = {
    spring: ["Mar", "Apr", "May"],
    summer: ["Jun", "Jul", "Aug"],
    fall: ["Sep", "Oct", "Nov"],
    winter: ["Dec", "Jan", "Feb"],
  };
  return map[season] || [];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function scoreDestination(dest: any, prefs: Preferences): number {
  let score = 0;

  const kbVibes: string[] = dest.vibe || [];
  const matchingTags = VIBE_TO_KB_TAGS[prefs.vibe] || [];
  const vibeOverlap = kbVibes.filter((v: string) => matchingTags.includes(v)).length;
  if (vibeOverlap > 0) score += 10 + vibeOverlap * 10;

  const allowedTiers = BUDGET_TO_KB_TIERS[prefs.budget_tier] || [];
  if (allowedTiers.includes(dest.price_tier)) score += 20;

  let travelMonths: string[] = [];
  if (prefs.dates.start_date) {
    const m = getMonthAbbrev(prefs.dates.start_date);
    if (m) travelMonths.push(m);
  }
  if (prefs.dates.season && prefs.dates.season !== "flexible") {
    travelMonths = [...travelMonths, ...seasonToMonths(prefs.dates.season)];
  }
  if (travelMonths.length > 0) {
    const bestMonths: string[] = dest.best_months || [];
    const avoidMonths: string[] = dest.avoid_months || [];
    if (travelMonths.some((m) => bestMonths.includes(m))) score += 15;
    if (travelMonths.some((m) => avoidMonths.includes(m))) score -= 25;
  } else {
    score += 5;
  }

  if (dest.group_size_sweet_spot) {
    const parts = dest.group_size_sweet_spot.split("-").map(Number);
    const [min, max] = [parts[0] || 0, parts[1] || parts[0] || 16];
    if (prefs.group_size >= min && prefs.group_size <= max) score += 10;
    else if (prefs.group_size <= max + 4) score += 5;
  }

  for (const priority of prefs.priorities) {
    const matcher = PRIORITY_MATCHES[priority];
    if (matcher && matcher(dest)) score += 8;
  }

  return score;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function filterAndRankDestinations(knowledgeBase: any, prefs: Preferences, limit: number = 5) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const scored = knowledgeBase.destinations.map((dest: any) => ({
    ...dest,
    score: scoreDestination(dest, prefs),
  }));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  scored.sort((a: any, b: any) => b.score - a.score);
  return scored.slice(0, limit);
}

/* ─── Destination Trimming ────────────────────────────────── */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function trimForConcepts(dest: any) {
  return {
    id: dest.id,
    destination: dest.destination,
    region: dest.region,
    nearest_airport: dest.nearest_airport,
    best_months: dest.best_months,
    avoid_months: dest.avoid_months,
    vibe: dest.vibe,
    price_tier: dest.price_tier,
    avg_cost_per_person_per_day: dest.avg_cost_per_person_per_day,
    group_size_sweet_spot: dest.group_size_sweet_spot,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    top_courses: dest.top_courses?.map((c: any) => ({
      name: c.name,
      peak_season_fee: c.peak_season_fee,
      off_peak_fee: c.off_peak_fee,
      condition_rating: c.condition_rating,
      scenery_rating: c.scenery_rating,
    })),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    hidden_gems: dest.hidden_gems?.map((c: any) => ({ name: c.name, peak_season_fee: c.peak_season_fee })),
    insider_tips: Array.isArray(dest.insider_tips) ? dest.insider_tips.slice(0, 2) : dest.insider_tips,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fullDestinationForPrompt(dest: any) {
  return {
    id: dest.id,
    destination: dest.destination,
    region: dest.region,
    nearest_airport: dest.nearest_airport,
    best_months: dest.best_months,
    avoid_months: dest.avoid_months,
    vibe: dest.vibe,
    price_tier: dest.price_tier,
    avg_cost_per_person_per_day: dest.avg_cost_per_person_per_day,
    group_size_sweet_spot: dest.group_size_sweet_spot,
    top_courses: dest.top_courses,
    hidden_gems: dest.hidden_gems,
    lodging_options: dest.lodging_options,
    dining: dest.dining,
    non_golf_activities: dest.non_golf_activities,
    insider_tips: dest.insider_tips,
    sample_itineraries: dest.sample_itineraries,
  };
}

/* ─── Date Helpers ────────────────────────────────────────── */

function buildDatesDescription(dates: Preferences["dates"]): string {
  if (dates.start_date && dates.end_date) return `${dates.start_date} to ${dates.end_date}`;
  if (dates.season && dates.season !== "flexible") return `${dates.season.charAt(0).toUpperCase() + dates.season.slice(1)} 2026`;
  return "Flexible / no specific dates";
}

/* ─── System Prompts ──────────────────────────────────────── */

function conceptsSystemPrompt(knowledgeContext: string): string {
  return `You are Nassau's AI Trip Advisor — an expert golf trip planner who speaks like a knowledgeable buddy, not a travel brochure.

Given the user's preferences, return exactly 3 trip concepts as a JSON object.

RULES:
- One concept must have badge "safe_pick" (most popular/obvious match)
- One must have badge "hidden_gem" (unexpected but perfect fit)
- One must have badge "dream_trip" (stretch option if budget allows)
- Use ONLY destinations and courses from the knowledge base
- Keep it concise: name, tagline, cost estimate, top 3 courses, 3-4 highlights, 1 insider tip
- NO full itinerary — just the highlights
- If dates fall in avoid months, don't recommend that destination
- CRITICAL: Complete the entire JSON. Do not stop mid-response.

Respond with ONLY this JSON object, no other text or markdown:
{
  "stage": "concepts",
  "concepts": [
    {
      "id": "concept-1",
      "concept_name": "catchy 3-5 word name",
      "destination": "City, State",
      "destination_id": "id from knowledge base",
      "tagline": "one exciting sentence",
      "estimated_cost_pp": number,
      "duration_nights": number,
      "top_courses": ["Course Name 1", "Course Name 2", "Course Name 3"],
      "highlights": ["highlight 1", "highlight 2", "highlight 3"],
      "insider_tip": "one specific tip",
      "badge": "safe_pick" | "hidden_gem" | "dream_trip"
    }
  ]
}

KNOWLEDGE BASE:
${knowledgeContext}`;
}

function followupSystemPrompt(knowledgeContext: string): string {
  return `You are Nassau's AI Trip Advisor helping narrow down a golf trip. The user liked certain destination concepts. Generate 3-4 smart follow-up questions that would help build the perfect trip.

Questions should feel like a knowledgeable friend asking the RIGHT questions — not generic survey questions.
Focus on: lodging preference, walking vs cart, dining style, number of rounds, non-golf activities.
Make options specific to the selected destination(s) with real venue names and prices from the knowledge base.

RULES:
- Each question must have type "single_select" with 2-3 options
- Each option needs value, label (with emoji), and detail (specific to destination)
- Include an intro_message that feels conversational and references the destinations
- CRITICAL: Complete the entire JSON. Do not stop mid-response.

Respond with ONLY this JSON object, no other text or markdown:
{
  "stage": "followup",
  "intro_message": "conversational intro referencing their picks",
  "questions": [
    {
      "id": "q1",
      "question": "Where does the group want to stay?",
      "type": "single_select",
      "options": [
        {"value": "resort", "label": "emoji Resort — short desc", "detail": "specific venue ($price/night)"},
        {"value": "house", "label": "emoji Rental House — short desc", "detail": "specific area ($price/night)"},
        {"value": "mix", "label": "emoji Mix it up", "detail": "details"}
      ]
    }
  ]
}

KNOWLEDGE BASE:
${knowledgeContext}`;
}

function buildSystemPrompt(knowledgeContext: string): string {
  return `You are Nassau's AI Trip Advisor. Build a complete, detailed trip itinerary for ONE destination.

Use the follow-up answers to customize everything:
- Lodging preference → recommend specific venues matching their choice
- Walking vs cart → exclude walking-only courses if they said cart only
- Dining style → include specific restaurants or cook-at-house nights
- Rounds per day → schedule 36-hole days if they want max golf

RULES:
- Use ONLY real course names, restaurants, lodging, and greens fees from the knowledge base
- Calculate realistic per-person costs from the knowledge base data
- Limit itinerary items to 3-4 per day
- Include 2-3 insider tips specific to the destination
- CRITICAL: Complete the entire JSON. Do not stop mid-response.

Respond with ONLY this JSON object, no other text or markdown:
{
  "stage": "build",
  "trip": {
    "concept_name": "catchy name",
    "destination": "City, State",
    "destination_id": "id from knowledge base",
    "tagline": "one exciting sentence customized to their answers",
    "duration_nights": number,
    "estimated_cost_pp": number,
    "cost_breakdown": { "golf": number, "lodging": number, "food": number, "transport": number, "other": number },
    "lodging": { "name": "specific venue", "type": "resort|house|hotel", "per_night": number, "why": "why this fits" },
    "courses": [
      { "name": "Course Name", "day": number, "time": "morning|afternoon", "estimated_fee": number, "why": "one sentence", "cart_included": boolean }
    ],
    "itinerary": [
      {
        "day": number,
        "title": "Day Title",
        "items": [
          { "time": "8:00 AM", "title": "Activity", "type": "tee_time|food|activity|travel", "cost_pp": number }
        ]
      }
    ],
    "insider_tips": ["tip 1", "tip 2", "tip 3"]
  }
}

KNOWLEDGE BASE:
${knowledgeContext}`;
}

/* ─── Claude API Call ─────────────────────────────────────── */

async function callClaude(apiKey: string, systemPrompt: string, userPrompt: string, maxTokens: number): Promise<{ data: unknown } | { error: string; status: number }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 55000);

  try {
    console.log("[AI Ideate] Calling Claude API, max_tokens:", maxTokens, "system prompt length:", systemPrompt.length);

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: maxTokens,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);
    console.log("[AI Ideate] Claude API responded:", response.status, response.statusText);

    if (!response.ok) {
      const errBody = await response.text();
      console.error("[AI Ideate] Claude API error:", response.status, errBody);
      if (response.status === 429) return { error: "We're getting a lot of requests right now. Try again in a minute.", status: 429 };
      if (response.status === 401) return { error: "AI service authentication failed. Contact support.", status: 503 };
      return { error: "Something went wrong generating your trip ideas. Try again?", status: 502 };
    }

    const result = await response.json();
    console.log("[AI Ideate] Claude response received, stop_reason:", result.stop_reason);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const textContent = result.content?.find((c: any) => c.type === "text");
    if (!textContent?.text) {
      console.error("[AI Ideate] No text content in response:", JSON.stringify(result).substring(0, 300));
      return { error: "AI returned an unexpected response. Try again?", status: 502 };
    }

    let jsonStr = textContent.text.trim();
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    try {
      const data = JSON.parse(jsonStr);
      return { data };
    } catch (parseErr) {
      console.error("[AI Ideate] JSON parse failed:", parseErr);
      console.error("[AI Ideate] Raw (first 500):", textContent.text.substring(0, 500));
      return { error: "AI generated an invalid response. Try again?", status: 502 };
    }
  } catch (err: unknown) {
    clearTimeout(timeout);
    const isAbort = err instanceof Error && err.name === "AbortError";
    if (isAbort) {
      console.error("[AI Ideate] Request timed out after 55s");
      return { error: "The AI took too long to respond. Try again?", status: 504 };
    }
    console.error("[AI Ideate] Unexpected error:", err instanceof Error ? err.message : String(err));
    return { error: "Something went wrong. Try again?", status: 500 };
  }
}

/* ─── POST Handler ────────────────────────────────────────── */

export async function POST(req: NextRequest) {
  console.log("[AI Ideate] Handler invoked");

  const user = await getUser();
  if (!user) return unauthorized();

  const apiKey = process.env.ANTHROPIC_API_KEY;
  console.log("[AI Ideate] ANTHROPIC_API_KEY exists:", !!apiKey);
  if (!apiKey) {
    return NextResponse.json(
      { error: "AI trip planning is not configured. Use 'I Have a Plan' to create your trip manually." },
      { status: 503 }
    );
  }

  const knowledgeBase = getKnowledgeBase();
  if (!knowledgeBase?.destinations) {
    return NextResponse.json({ error: "Trip planning data unavailable." }, { status: 500 });
  }

  let body: IdeateRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const stage = body.stage;
  console.log("[AI Ideate] Stage:", stage);

  switch (stage) {
    /* ── Stage 1: Concepts ─────────────────────────────────── */
    case "concepts": {
      const prefs = body.preferences;
      if (!prefs?.vibe || !prefs?.budget_tier || !prefs?.group_size) {
        return NextResponse.json({ error: "Missing required preferences" }, { status: 400 });
      }

      const topDests = filterAndRankDestinations(knowledgeBase, prefs, 5);
      console.log("[AI Ideate] Top destinations:", topDests.map((d: any) => `${d.destination} (${d.score})`)); // eslint-disable-line @typescript-eslint/no-explicit-any
      const trimmed = topDests.map(trimForConcepts);
      const knowledgeContext = JSON.stringify({ budget_tier_definitions: knowledgeBase.budget_tier_definitions, destinations: trimmed }, null, 0);

      const userPrompt = `Plan a golf trip with these preferences:
- Vibe: ${prefs.vibe}
- Group size: ${prefs.group_size} golfers
- Budget: ${prefs.budget_tier} per person per day
- Dates: ${buildDatesDescription(prefs.dates)}
- Priorities: ${prefs.priorities.length > 0 ? prefs.priorities.join(", ") : "None specified"}
- Notes: ${prefs.notes || "None"}

Return exactly 3 distinct trip concepts.`;

      const result = await callClaude(apiKey, conceptsSystemPrompt(knowledgeContext), userPrompt, 3000);
      if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });

      console.log("[AI Ideate] Concepts generated successfully");
      return NextResponse.json(result.data);
    }

    /* ── Stage 2: Follow-up Questions ──────────────────────── */
    case "followup": {
      const { original_preferences: prefs, selected_concepts } = body;
      if (!prefs || !selected_concepts?.length) {
        return NextResponse.json({ error: "Missing preferences or selected concepts" }, { status: 400 });
      }

      // Find full destination data for selected concepts
      const selectedIds = selected_concepts.map((c: Record<string, unknown>) => c.destination_id);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const selectedDests = knowledgeBase.destinations.filter((d: any) => selectedIds.includes(d.id)).map(fullDestinationForPrompt);
      const knowledgeContext = JSON.stringify({ destinations: selectedDests }, null, 0);

      const conceptSummary = selected_concepts.map((c: Record<string, unknown>) => `- ${c.concept_name} (${c.destination})`).join("\n");
      const userPrompt = `The user is planning a golf trip and liked these concepts:
${conceptSummary}

Their preferences:
- Vibe: ${prefs.vibe}
- Group size: ${prefs.group_size} golfers
- Budget: ${prefs.budget_tier}
- Dates: ${buildDatesDescription(prefs.dates)}

Generate 3-4 smart follow-up questions to help narrow down the perfect trip. Make options specific to ${selected_concepts.map((c: Record<string, unknown>) => c.destination).join(" and ")} with real venue names and prices.`;

      const result = await callClaude(apiKey, followupSystemPrompt(knowledgeContext), userPrompt, 2000);
      if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });

      console.log("[AI Ideate] Follow-up questions generated successfully");
      return NextResponse.json(result.data);
    }

    /* ── Stage 3: Full Build ───────────────────────────────── */
    case "build": {
      const { original_preferences: prefs, selected_concept, followup_answers } = body;
      if (!prefs || !selected_concept || !followup_answers) {
        return NextResponse.json({ error: "Missing build parameters" }, { status: 400 });
      }

      // Get full destination data
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const dest = knowledgeBase.destinations.find((d: any) => d.id === selected_concept.destination_id);
      const destData = dest ? fullDestinationForPrompt(dest) : null;
      const knowledgeContext = JSON.stringify({
        trip_structure_rules: knowledgeBase.trip_structure_rules,
        budget_tier_definitions: knowledgeBase.budget_tier_definitions,
        destination: destData,
      }, null, 0);

      const answersStr = Object.entries(followup_answers).map(([q, a]) => `- ${q}: ${a}`).join("\n");
      const userPrompt = `Build a complete trip itinerary for this golf trip:

Selected destination: ${selected_concept.concept_name} — ${selected_concept.destination}

Original preferences:
- Vibe: ${prefs.vibe}
- Group size: ${prefs.group_size} golfers
- Budget: ${prefs.budget_tier}
- Dates: ${buildDatesDescription(prefs.dates)}
- Priorities: ${prefs.priorities.length > 0 ? prefs.priorities.join(", ") : "None"}
- Notes: ${prefs.notes || "None"}

Follow-up answers:
${answersStr}

Build ONE detailed trip with day-by-day itinerary, specific courses, restaurants, lodging, and costs.`;

      const result = await callClaude(apiKey, buildSystemPrompt(knowledgeContext), userPrompt, 6000);
      if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });

      console.log("[AI Ideate] Full trip built successfully");
      return NextResponse.json(result.data);
    }

    default:
      return NextResponse.json({ error: `Unknown stage: ${stage}` }, { status: 400 });
  }
}
