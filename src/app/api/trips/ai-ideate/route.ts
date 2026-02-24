import { NextRequest, NextResponse } from "next/server";
import { getUser, unauthorized } from "@/lib/auth";
import knowledgeBase from "@/data/nassau-knowledge-base.json";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Destination = (typeof knowledgeBase.destinations)[number] & { score?: number };

interface IdeateRequest {
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

// Map user-facing vibe IDs to knowledge base vibe tags
const VIBE_TO_KB_TAGS: Record<string, string[]> = {
  competitive: ["golf-purist", "traditional", "bucket-list", "walking-only"],
  party: ["nightlife", "bachelor-party-friendly", "live-music", "entertainment", "casino"],
  relaxed: ["relaxed", "laid-back", "coastal", "beach", "scenic"],
  "father-son": ["father-son", "traditional", "bucket-list", "historic"],
  corporate: ["resort", "premium", "luxury"],
  "bucket-list": ["bucket-list", "once-in-a-lifetime", "special-occasion", "international"],
};

// Map user-facing budget tiers to KB price_tier values
const BUDGET_TO_KB_TIERS: Record<string, string[]> = {
  budget: ["budget"],
  mid: ["budget", "mid"],
  premium: ["mid", "mid-high", "premium"],
  luxury: ["premium", "mid-high", "luxury"],
};

// Map priority labels to destination features for scoring
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const PRIORITY_MATCHES: Record<string, (d: any) => boolean> = {
  "Elite courses": (d) =>
    d.top_courses?.some(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (c: any) => (c.condition_rating ?? 0) >= 4.5 || (c.scenery_rating ?? 0) >= 4.5
    ) ?? false,
  "Great food scene": (d) =>
    (d.dining?.length ?? 0) >= 4 ||
    d.vibe?.includes("food-scene"),
  "Beach access": (d) =>
    d.vibe?.includes("beach") ||
    d.vibe?.includes("coastal") ||
    d.vibe?.includes("ocean") ||
    d.destination?.toLowerCase().includes("beach"),
  "Nightlife": (d) =>
    d.vibe?.includes("nightlife") ||
    d.vibe?.includes("entertainment") ||
    d.vibe?.includes("bachelor-party-friendly"),
  "Best value": (d) =>
    d.price_tier === "budget" ||
    d.vibe?.includes("budget-friendly"),
  "Perfect weather": (d) =>
    d.region === "Southwest" || d.region === "Desert" || d.region === "Mexico",
  "Scenic beauty": (d) =>
    d.vibe?.includes("scenic") ||
    d.vibe?.includes("ocean") ||
    d.vibe?.includes("mountain") ||
    d.vibe?.includes("Ozark-scenery"),
  "Craft beer/bourbon": (d) =>
    d.vibe?.includes("bourbon-trail") ||
    d.vibe?.includes("live-music") ||
    d.destination?.includes("Austin") ||
    d.destination?.includes("Savannah"),
  "Casino/entertainment": (d) =>
    d.vibe?.includes("casino") ||
    d.vibe?.includes("entertainment") ||
    d.destination?.includes("Las Vegas"),
  "Off the beaten path": (d) =>
    d.vibe?.includes("hidden-gem") ||
    d.vibe?.includes("hidden-gem-vibe") ||
    d.vibe?.includes("midwest-getaway") ||
    d.destination?.includes("Bandon") ||
    d.destination?.includes("Streamsong") ||
    d.destination?.includes("Sand Valley"),
};

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
function scoreDestination(dest: any, req: IdeateRequest): number {
  let score = 0;

  // Vibe match (highest weight)
  const kbVibes: string[] = dest.vibe || [];
  const matchingTags = VIBE_TO_KB_TAGS[req.vibe] || [];
  const vibeOverlap = kbVibes.filter((v: string) => matchingTags.includes(v)).length;
  if (vibeOverlap > 0) score += 10 + vibeOverlap * 10; // 20-50 points

  // Budget match
  const allowedTiers = BUDGET_TO_KB_TIERS[req.budget_tier] || [];
  if (allowedTiers.includes(dest.price_tier)) score += 20;

  // Season/date match
  let travelMonths: string[] = [];
  if (req.dates.start_date) {
    const m = getMonthAbbrev(req.dates.start_date);
    if (m) travelMonths.push(m);
  }
  if (req.dates.season && req.dates.season !== "flexible") {
    travelMonths = [...travelMonths, ...seasonToMonths(req.dates.season)];
  }
  if (travelMonths.length > 0) {
    const bestMonths: string[] = dest.best_months || [];
    const avoidMonths: string[] = dest.avoid_months || [];
    const inBest = travelMonths.some((m) => bestMonths.includes(m));
    const inAvoid = travelMonths.some((m) => avoidMonths.includes(m));
    if (inBest) score += 15;
    if (inAvoid) score -= 25; // Strong penalty for avoid months
  } else {
    score += 5; // Flexible dates — slight bonus
  }

  // Group size match
  if (dest.group_size_sweet_spot) {
    const parts = dest.group_size_sweet_spot.split("-").map(Number);
    const [min, max] = [parts[0] || 0, parts[1] || parts[0] || 16];
    if (req.group_size >= min && req.group_size <= max) score += 10;
    else if (req.group_size <= max + 4) score += 5;
  }

  // Priority matches
  for (const priority of req.priorities) {
    const matcher = PRIORITY_MATCHES[priority];
    if (matcher && matcher(dest)) score += 8;
  }

  return score;
}

function filterAndRankDestinations(req: IdeateRequest) {
  const scored = knowledgeBase.destinations.map((dest) => ({
    ...dest,
    score: scoreDestination(dest, req),
  }));

  scored.sort((a, b) => b.score - a.score);

  // Return top 5-8
  return scored.slice(0, Math.min(8, Math.max(5, scored.length)));
}

function buildDatesDescription(dates: IdeateRequest["dates"]): string {
  if (dates.start_date && dates.end_date) {
    return `${dates.start_date} to ${dates.end_date}`;
  }
  if (dates.season && dates.season !== "flexible") {
    return `${dates.season.charAt(0).toUpperCase() + dates.season.slice(1)} 2026`;
  }
  return "Flexible / no specific dates";
}

const SYSTEM_PROMPT = `You are Nassau's AI Trip Advisor — an expert golf trip planner who knows every course, every destination, and every insider trick. You speak like a knowledgeable buddy who's played everywhere, not like a travel brochure.

Your personality: The annoyingly organized friend who makes the group chat unnecessary. You're enthusiastic but practical. You know the hidden gems and the overrated tourist traps.

RULES:
- Generate exactly 2-3 trip concepts as a JSON array
- Each concept should be a meaningfully DIFFERENT option (not 3 versions of the same trip)
- One option should be the "safe pick" (most popular/obvious match)
- One should be the "hidden gem" (unexpected but perfect fit)
- If budget allows, include one "dream trip" stretch option
- Use ONLY destinations and courses from the knowledge base provided
- Include specific course names, real greens fees, real restaurants
- Calculate realistic per-person costs based on the knowledge base data
- If the requested dates fall in a destination's "avoid months," DON'T recommend it

OUTPUT FORMAT — respond with ONLY this JSON array, no other text or markdown:
[
  {
    "concept_name": "string — catchy 3-5 word trip name",
    "destination": "string — city, state",
    "destination_id": "string — matching id from knowledge base",
    "tagline": "string — one exciting sentence about why this trip",
    "vibe_match": "string — why this matches their vibe",
    "badge": "safe-pick" | "hidden-gem" | "dream-trip",
    "duration_nights": number,
    "estimated_cost_pp": number,
    "cost_breakdown": {
      "golf": number,
      "lodging": number,
      "food": number,
      "transport": number,
      "other": number
    },
    "courses": [
      {
        "name": "string",
        "day": number,
        "time": "morning" | "afternoon",
        "estimated_fee": number,
        "why": "string — one sentence on why this course"
      }
    ],
    "lodging": {
      "name": "string",
      "type": "resort" | "airbnb" | "hotel",
      "per_night": number,
      "why": "string"
    },
    "highlights": ["string — 3-4 trip highlights"],
    "insider_tip": "string — one specific insider tip",
    "itinerary": [
      {
        "day": number,
        "title": "string — day title",
        "items": [
          {
            "time": "string — e.g. 8:00 AM",
            "title": "string",
            "type": "tee_time" | "food" | "activity" | "travel",
            "cost_pp": number
          }
        ]
      }
    ]
  }
]`;

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return unauthorized();

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "AI trip planning is not configured. Use 'I Have a Plan' to create your trip manually.",
      },
      { status: 503 }
    );
  }

  let body: IdeateRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  // Validate required fields
  if (!body.vibe || !body.budget_tier || !body.group_size) {
    return NextResponse.json(
      { error: "Missing required fields: vibe, budget_tier, group_size" },
      { status: 400 }
    );
  }

  console.log("[AI Ideate] Request:", JSON.stringify(body, null, 2));

  // Filter and rank destinations
  const topDestinations = filterAndRankDestinations(body);
  console.log(
    "[AI Ideate] Top destinations:",
    topDestinations.map((d) => `${d.destination} (score: ${d.score})`)
  );

  // Build knowledge base context (only send relevant destinations)
  const knowledgeContext = JSON.stringify(
    {
      trip_structure_rules: knowledgeBase.trip_structure_rules,
      budget_tier_definitions: knowledgeBase.budget_tier_definitions,
      seasonal_calendar: knowledgeBase.seasonal_calendar,
      destinations: topDestinations,
    },
    null,
    0 // compact JSON to save tokens
  );

  const systemPrompt =
    SYSTEM_PROMPT + "\n\nKNOWLEDGE BASE:\n" + knowledgeContext;

  const userPrompt = `Plan a golf trip with these preferences:
- Vibe: ${body.vibe}
- Group size: ${body.group_size} golfers
- Budget: ${body.budget_tier} (per person per day)
- Dates: ${buildDatesDescription(body.dates)}
- Top priorities: ${body.priorities.length > 0 ? body.priorities.join(", ") : "None specified"}
- Additional notes: ${body.notes || "None"}

Generate 2-3 distinct trip concepts. Make them specific, actionable, and exciting.`;

  console.log("[AI Ideate] Calling Claude API...");

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4000,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errBody = await response.text();
      console.error("[AI Ideate] Claude API error:", response.status, errBody);

      if (response.status === 429) {
        return NextResponse.json(
          { error: "We're getting a lot of requests right now. Try again in a minute." },
          { status: 429 }
        );
      }

      return NextResponse.json(
        { error: "Something went wrong generating your trip ideas. Try again?" },
        { status: 502 }
      );
    }

    const result = await response.json();
    console.log("[AI Ideate] Claude response received, stop_reason:", result.stop_reason);

    // Extract text content from Claude response
    const textContent = result.content?.find(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (c: any) => c.type === "text"
    );
    if (!textContent?.text) {
      console.error("[AI Ideate] No text content in response:", result);
      return NextResponse.json(
        { error: "AI returned an unexpected response. Try again?" },
        { status: 502 }
      );
    }

    // Parse JSON from Claude's response
    // Claude might wrap it in markdown backticks
    let jsonStr = textContent.text.trim();
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    let concepts;
    try {
      concepts = JSON.parse(jsonStr);
    } catch (parseErr) {
      console.error("[AI Ideate] Failed to parse Claude response as JSON:", parseErr);
      console.error("[AI Ideate] Raw response:", textContent.text);
      return NextResponse.json(
        { error: "AI generated an invalid response. Try again?" },
        { status: 502 }
      );
    }

    if (!Array.isArray(concepts) || concepts.length === 0) {
      return NextResponse.json(
        { error: "AI didn't generate any trip concepts. Try again?" },
        { status: 502 }
      );
    }

    console.log(
      "[AI Ideate] Generated",
      concepts.length,
      "concepts:",
      concepts.map(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (c: any) => c.concept_name
      )
    );

    return NextResponse.json({ concepts });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      console.error("[AI Ideate] Request timed out");
      return NextResponse.json(
        { error: "The AI took too long to respond. Try again?" },
        { status: 504 }
      );
    }

    console.error("[AI Ideate] Unexpected error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Try again?" },
      { status: 500 }
    );
  }
}
