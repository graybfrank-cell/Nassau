import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

// ── Seasonal hooks calendar ──
function getSeasonalHooks(): string {
  const now = new Date();
  const month = now.getMonth(); // 0-indexed
  const day = now.getDate();

  const hooks: string[] = [];

  // Year-round recurring
  hooks.push("- Weekend round planning (every Thursday/Friday people plan weekend golf)");

  // Monthly/seasonal
  if (month >= 1 && month <= 3) {
    hooks.push("- Spring trip booking season (peak planning period for Apr-Jun trips)");
    hooks.push("- Masters anticipation content (April Masters = biggest golf cultural moment)");
    hooks.push("- Spring break golf trips");
    hooks.push("- Early bird summer trip deals");
  }
  if (month === 3) {
    hooks.push("- MASTERS WEEK (Apr 7-13) — highest golf engagement of the year");
    hooks.push("- Tax refund season → 'put your refund toward the boys' trip'");
  }
  if (month >= 4 && month <= 6) {
    hooks.push("- Peak golf season starting — weekend round frequency increases");
    hooks.push("- Memorial Day golf trip planning");
    hooks.push("- Father's Day golf content (gift guides, trip ideas)");
    hooks.push("- US Open buzz");
    hooks.push("- Summer buddy trip season");
  }
  if (month >= 6 && month <= 8) {
    hooks.push("- Peak summer golf — highest round volume of the year");
    hooks.push("- The Open Championship buzz");
    hooks.push("- Labor Day trip planning");
    hooks.push("- Fall golf trip early planning (Pinehurst, Kiawah, Bandon shoulder season)");
  }
  if (month >= 8 && month <= 10) {
    hooks.push("- Fall golf — best weather in the South/Southwest");
    hooks.push("- Ryder Cup / Presidents Cup years — massive engagement");
    hooks.push("- Scottsdale/Arizona trip season starting");
    hooks.push("- Holiday gift guide planning for golf gear/trips");
  }
  if (month >= 10 || month <= 1) {
    hooks.push("- New Year's resolution golf trips");
    hooks.push("- Winter golf escape planning (Scottsdale, Palm Springs, Florida)");
    hooks.push("- Holiday golf gift guides");
    hooks.push("- Year-end 'best rounds of the year' recaps");
    hooks.push("- Early booking deals for spring/summer trips");
  }

  // Nassau-specific
  if (month === 2 && day <= 15) {
    hooks.push("- 🚀 NASSAU LAUNCH (April 1) — pre-launch content ramp-up");
  }
  if (month === 3 && day === 1) {
    hooks.push("- 🚀 NASSAU LAUNCH DAY — all hands on content");
  }

  return hooks.join("\n");
}

// ── Competitor list ──
const COMPETITORS = `
COMPETITORS TO MONITOR (search for recent news, feature launches, user complaints):
- 18Birdies: GPS rangefinder + scorecard app, recently added group features
- Golflogix: GPS app with green maps, expanding into social features
- GolfNow: Tee time booking, has group booking but poor coordination tools
- Arccos: Smart sensors + AI caddie, premium price point
- Hole19: European-focused GPS + scorecard, community features
- TheGrint: Handicap tracking + tournament mode
- Golf Genius: Tournament management, used by clubs (enterprise)
- SwingU: GPS + instruction content
- Partiful: Not golf-specific but their invite/RSVP mechanic is what we're competing with for trip coordination
- Splitwise: Expense splitting (we compete for the "who owes what" use case on trips)

Look for: feature launches we should respond to, user complaints we can solve, gaps they're not filling (especially group coordination, trip planning, betting/skins tracking)
`;

export async function POST() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY not configured" },
      { status: 500 }
    );
  }

  try {
    // ── Step 1: Pull feedback data ──
    const { data: engagedAlerts } = await supabaseAdmin
      .from("marketing_scout_alerts")
      .select("summary, opportunity_type, source, suggested_content_topic")
      .in("status", ["engaged", "content_created"])
      .order("created_at", { ascending: false })
      .limit(15);

    const { data: dismissedAlerts } = await supabaseAdmin
      .from("marketing_scout_alerts")
      .select("summary, opportunity_type, source")
      .eq("status", "dismissed")
      .order("created_at", { ascending: false })
      .limit(10);

    const { data: topContent } = await supabaseAdmin
      .from("marketing_content")
      .select("title, type, status, impressions, likes, shares")
      .order("impressions", { ascending: false })
      .limit(5);

    // ── Step 2: Build prompt with all context ──
    const feedbackContext = buildFeedbackContext(
      engagedAlerts || [],
      dismissedAlerts || [],
      topContent || []
    );

    const seasonalHooks = getSeasonalHooks();
    const prompt = buildScoutPrompt(feedbackContext, seasonalHooks);

    // ── Step 3: Call Claude with web search ──
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        tools: [{ type: "web_search_20250305", name: "web_search" }],
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `Anthropic API error: ${response.status}`, details: errorText },
        { status: 502 }
      );
    }

    const data = await response.json();

    const textContent = data.content
      .filter((block: { type: string }) => block.type === "text")
      .map((block: { text: string }) => block.text)
      .join("\n");

    const clean = textContent.replace(/```json|```/g, "").trim();

    let alerts: Record<string, unknown>[];
    try {
      alerts = JSON.parse(clean);
    } catch {
      const arrayMatch = clean.match(/\[[\s\S]*\]/);
      if (arrayMatch) {
        alerts = JSON.parse(arrayMatch[0]);
      } else {
        return NextResponse.json(
          { error: "Could not parse alerts from response", raw: textContent.slice(0, 500) },
          { status: 500 }
        );
      }
    }

    if (!Array.isArray(alerts) || alerts.length === 0) {
      return NextResponse.json(
        { error: "Expected non-empty array of alerts", raw: textContent.slice(0, 500) },
        { status: 500 }
      );
    }

    // ── Step 4: Map to correct DB columns and insert ──
    const now = new Date().toISOString();
    const rows = alerts.map((alert: Record<string, unknown>) => ({
      source: String(alert.source || "Scout Agent"),
      url: alert.url || alert.source_url || null,
      summary: String(alert.summary || alert.description || ""),
      opportunity_type: String(alert.opportunity_type || alert.type || "content"),
      suggested_response: alert.suggested_response || null,
      suggested_content_topic: alert.suggested_content_topic || alert.title || null,
      status: "new",
      created_at: now,
    }));

    const validRows = rows.filter((r: { summary: string }) => r.summary && r.summary.length > 5);

    if (validRows.length === 0) {
      return NextResponse.json({
        success: true,
        alertsCreated: 0,
        message: "No valid alerts parsed",
      });
    }

    const { error: insertError } = await supabaseAdmin
      .from("marketing_scout_alerts")
      .insert(validRows);

    if (insertError) {
      return NextResponse.json(
        { error: `Insert failed: ${insertError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      alertsCreated: validRows.length,
      feedbackUsed: {
        engaged: (engagedAlerts || []).length,
        dismissed: (dismissedAlerts || []).length,
        topContent: (topContent || []).length,
      },
      seasonalHooksActive: seasonalHooks.split("\n").length,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Scout agent failed" },
      { status: 500 }
    );
  }
}

// ── Feedback context builder ──
function buildFeedbackContext(
  engaged: Record<string, unknown>[],
  dismissed: Record<string, unknown>[],
  topContent: Record<string, unknown>[]
): string {
  const sections: string[] = [];

  if (engaged.length > 0) {
    sections.push(
      `## ALERTS THE TEAM ENGAGED WITH (find MORE like these):\n${engaged
        .map((a: Record<string, unknown>, i: number) => `${i + 1}. [${a.opportunity_type}] ${a.summary}${a.suggested_content_topic ? ` → "${a.suggested_content_topic}"` : ""}`)
        .join("\n")}`
    );
  }

  if (dismissed.length > 0) {
    sections.push(
      `## ALERTS THE TEAM DISMISSED (find FEWER like these):\n${dismissed
        .map((a: Record<string, unknown>, i: number) => `${i + 1}. [${a.opportunity_type}] ${a.summary}`)
        .join("\n")}`
    );
  }

  if (topContent.length > 0) {
    sections.push(
      `## TOP PERFORMING CONTENT (scout for similar opportunities):\n${topContent
        .map((c: Record<string, unknown>, i: number) => `${i + 1}. "${c.title}" (${c.type}) — ${c.impressions || 0} imp, ${c.likes || 0} likes, ${c.shares || 0} shares`)
        .join("\n")}`
    );
  }

  return sections.length > 0
    ? `\n--- FEEDBACK FROM PAST PERFORMANCE ---\n${sections.join("\n\n")}\n--- END FEEDBACK ---\n`
    : "";
}

// ── Scout prompt builder ──
function buildScoutPrompt(feedbackContext: string, seasonalHooks: string): string {
  return `You are the Scout Agent for Nassau (nassau.golf), a golf trip planning and round tracking app launching April 1, 2026.

NASSAU'S BRAND & AUDIENCE:
- Voice: "Trip captain's inner monologue" — loves golf, loves his friends, can't believe nobody Venmo'd him back yet
- Audience: Trip captains, 28-45, play 2-4x/month, plan 1-3 trips/year
- Content pillars: (1) Trip planning pain points, (2) Golf betting/games culture, (3) Course reviews & hidden gems, (4) Trip budget breakdowns
- Platforms: Instagram (primary), Twitter/X, TikTok, YouTube Shorts, LinkedIn
- We use: trip, round, the boys, captain, skins, your crew, locked in, pressed
- We never use: event, user, organizer, synergy, leverage, itinerary management platform

Your job: scan the golf world for opportunities that fit THIS brand.

## SEARCH CATEGORIES (search the web for ALL of these):

### 1. Trending Golf Content
- Reddit r/golf top posts this week (trip reports, course recs, complaints)
- Twitter/X #golf #GolfTrip #GolfTok trending topics
- TikTok golf creators — viral videos, new formats, trending sounds
- Golf YouTube — popular recent videos about trips, courses, gear

### 2. Golf News & Events
- PGA Tour / LIV news relevant to amateur golfers
- New course openings, major renovations, course closures
- Tournament schedules that create content opportunities
- Golf industry reports (spending trends, participation data)

### 3. Competitor Intelligence
${COMPETITORS}

### 4. Seasonal Opportunities (active right now)
${seasonalHooks}

### 5. Community & Culture
- Golf trip planning discussions (Reddit, forums, Facebook groups)
- Golf betting/gambling culture content
- "Golf trip of a lifetime" stories and viral trip content
- Group coordination complaints (the pain we solve)
- Golf memes and humor trends

### 6. Golf Travel & Destinations
- New golf travel packages or deals
- Destination popularity shifts (what's hot, what's overrated)
- Course ranking changes (Golf Digest, GOLF Magazine)
- Budget breakdown content from other creators

### 7. Golf Influencers & Creators
- Rising golf creators on Instagram/TikTok/YouTube
- Potential collaboration or content crossover opportunities
- Influencers planning group trips (could use Nassau)
${feedbackContext}

Return ONLY a JSON array of 6-10 alerts:

[
  {
    "source": "Where you found this (e.g., Reddit r/golf, Golf Digest, @creator on TikTok)",
    "url": "https://direct-link-to-source",
    "summary": "2-3 sentence explanation of the opportunity and why it matters for Nassau",
    "opportunity_type": "content_idea | engage | trending | partnership | competitor | seasonal | influencer",
    "suggested_response": "Specific action Nassau should take (e.g., 'Create carousel breaking down the costs mentioned in this thread')",
    "suggested_content_topic": "Exact content piece title (e.g., 'The Real Cost of a Bandon Dunes Trip: $2,400 for 4 Days')"
  }
]

Guidelines:
- Every field is REQUIRED
- Be SPECIFIC — reference actual posts, articles, threads you found via web search
- Include direct URLs
- suggested_content_topic should be a real, publishable title in Nassau's voice
- Prioritize opportunities actionable within 1-2 weeks
- At least 1 competitor alert, 1 seasonal alert, and 1 community/engage alert per run
- Don't repeat topics from previous engaged/dismissed alerts`;
}
