import { NextResponse } from "next/server";
import { requireMarketingAdmin } from "@/lib/marketing-auth";
import { createServiceClient } from "@/lib/supabase/admin";
import { callClaude, extractJSON } from "@/lib/marketing-claude";

const NASSAU_BRAND_VOICE = `
NASSAU BRAND VOICE (follow this exactly):
- You're the trip captain's inner monologue — loves golf, loves his friends, can't believe nobody Venmo'd him back yet
- Clubhouse Cool: Polished but relaxed. Augusta's veranda, not a startup Slack channel.
- Sharp Not Loud: Confident without trying hard. Dry humor. Never desperate.
- Insider Language: skins, nassau, press, the tips, range rats, the loop, captain, the group text
- Stakes Make It Fun: Lean into competitive, money-on-the-line energy
- Captain's Right Hand: Respect that someone does the heavy lifting in every group

Words we use: trip, round, the boys, captain, skins, your crew, your guys, the group, locked in, dialed, pressed, carry, tee it up, let's ride
Words we NEVER use: event, user, organizer, participant, wager, itinerary management platform, synergy, leverage, nestled, journey

Voice examples:
- "Your buddy says 'I'll Venmo you later' and you both know that's a lie."
- "Scottsdale in March: $185/round average, 72° every day, and the group chat finally stops arguing."
- "$2,400 for 4 days in Bandon with 6 guys. Here's every dollar."
- "POV: You're the one friend trying to plan the boys' golf trip and no one will commit to dates"

Content mix: 60% humor / 20% pain points / 20% product-adjacent
Post ratio: 70% culture content (golf humor, trip captain life, destination inspo) / 30% product content (features, demos, testimonials)
`;

const CONTENT_PILLARS = `
CONTENT PILLARS (rotate evenly across the week):
1. Trip planning pain points & solutions (group chat chaos, Venmo hell, the guy who won't commit)
2. Golf betting/games culture (skins, nassau bets, presses, side action, settling up)
3. Course reviews & hidden gems (real courses, real prices, real opinions)
4. Trip budget breakdowns (actual dollar amounts, flight + lodging + greens fees + food)
`;

export async function POST() {
  try {
    console.log("[strategist] Starting with performance feedback...");
    const auth = await requireMarketingAdmin();
    if (!auth.authorized) return auth.response;

    let supabase;
    try {
      supabase = createServiceClient();
    } catch (err) {
      console.error("[strategist] Failed to create Supabase client:", err);
      return NextResponse.json({ error: "Database connection failed" }, { status: 500 });
    }

    // ── Step 1: Get current week start (Monday) ──
    const now = new Date();
    const dayOfWeek = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7));
    const weekStart = monday.toISOString().split("T")[0];

    // ── Step 2: Pull LAST WEEK's performance data ──
    const lastMonday = new Date(monday);
    lastMonday.setDate(monday.getDate() - 7);
    const lastWeekStart = lastMonday.toISOString().split("T")[0];

    const { data: lastWeekContent } = await supabase
      .from("marketing_content")
      .select("title, type, status, impressions, likes, comments, shares, link_clicks, scheduled_platform, pillar")
      .gte("created_at", lastWeekStart)
      .lt("created_at", weekStart)
      .order("impressions", { ascending: false })
      .limit(20);

    // ── Step 3: Pull last week's plan for comparison ──
    const { data: lastWeekPlan } = await supabase
      .from("marketing_weekly_plans")
      .select("plan, performance_summary")
      .eq("week_start", lastWeekStart)
      .limit(1);

    // ── Step 4: Pull recent scout alerts (unacted) ──
    const { data: scoutAlerts } = await supabase
      .from("marketing_scout_alerts")
      .select("summary, opportunity_type, suggested_content_topic, source")
      .eq("status", "new")
      .order("created_at", { ascending: false })
      .limit(10);

    // ── Step 5: Pull engaged scout alerts (what worked) ──
    const { data: engagedAlerts } = await supabase
      .from("marketing_scout_alerts")
      .select("summary, opportunity_type, suggested_content_topic")
      .in("status", ["engaged", "content_created"])
      .order("created_at", { ascending: false })
      .limit(10);

    // ── Step 6: Build performance summary ──
    const perfSummary = buildPerformanceSummary(lastWeekContent || []);

    // ── Step 7: Build the strategist prompt ──
    const prompt = buildStrategistPrompt({
      weekStart,
      perfSummary,
      lastWeekPlan: lastWeekPlan?.[0] || null,
      scoutAlerts: scoutAlerts || [],
      engagedAlerts: engagedAlerts || [],
    });

    console.log("[strategist] Calling Claude with performance context...");
    const raw = await callClaude({
      system: "You are the Nassau Content Strategist. Respond with ONLY valid JSON, no markdown fences, no preamble.",
      messages: [{ role: "user", content: prompt }],
      maxTokens: 8192,
    });

    const plan = extractJSON(raw);
    console.log("[strategist] Plan generated, saving...");

    // ── Step 8: Save the plan ──
    const { data: savedPlan, error: planError } = await supabase
      .from("marketing_weekly_plans")
      .upsert(
        {
          week_start: weekStart,
          plan,
          performance_summary: perfSummary,
        },
        { onConflict: "week_start" }
      )
      .select()
      .single();

    if (planError) {
      console.error("[strategist] Failed to save plan:", planError);
      return NextResponse.json({ error: planError.message }, { status: 500 });
    }

    // ── Step 9: Seed content ideas into pipeline ──
    const planData = typeof plan === "string" ? JSON.parse(plan) : plan;
    const days = (planData as { days?: Array<{ date?: string; slots?: Array<{ hook?: string; topic?: string; platform?: string; content_type?: string; format?: string; pillar?: string; notes?: string }> }> })?.days || [];
    const contentToInsert = days.flatMap((day: { date?: string; slots?: Array<{ hook?: string; topic?: string; platform?: string; content_type?: string; format?: string; pillar?: string; notes?: string }> }) =>
      (day.slots || []).map((slot: { hook?: string; topic?: string; platform?: string; content_type?: string; format?: string; pillar?: string; notes?: string }) => ({
        title: slot.hook || slot.topic || "Untitled",
        type: slot.content_type || slot.format || "post",
        status: "idea",
        scheduled_platform: slot.platform || null,
        pillar: slot.pillar || null,
        source_agent: "strategist",
        notes: slot.notes || null,
        scheduled_at: day.date ? new Date(day.date + "T09:00:00").toISOString() : null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }))
    );

    if (contentToInsert.length > 0) {
      const { error: contentError } = await supabase
        .from("marketing_content")
        .insert(contentToInsert);

      if (contentError) {
        console.error("[strategist] Failed to seed content:", contentError);
      }
    }

    return NextResponse.json({
      success: true,
      week_start: weekStart,
      plan: savedPlan,
      content_seeded: contentToInsert.length,
      performance_context: {
        last_week_posts: (lastWeekContent || []).length,
        scout_alerts_used: (scoutAlerts || []).length,
        engaged_patterns: (engagedAlerts || []).length,
      },
    });
  } catch (error) {
    console.error("[strategist] Error:", error);
    return NextResponse.json(
      { error: "Strategist agent failed" },
      { status: 500 }
    );
  }
}

// ── Build performance summary from last week's content ──
function buildPerformanceSummary(content: Record<string, unknown>[]): string {
  if (content.length === 0) return "No content performance data from last week.";

  const totalImpressions = content.reduce((sum, c) => sum + (Number(c.impressions) || 0), 0);
  const totalLikes = content.reduce((sum, c) => sum + (Number(c.likes) || 0), 0);
  const totalComments = content.reduce((sum, c) => sum + (Number(c.comments) || 0), 0);
  const totalShares = content.reduce((sum, c) => sum + (Number(c.shares) || 0), 0);
  const totalClicks = content.reduce((sum, c) => sum + (Number(c.link_clicks) || 0), 0);

  const top3 = content.slice(0, 3);
  const topPerformers = top3
    .map((c, i) => `  ${i + 1}. "${c.title}" (${c.scheduled_platform || c.type}) — ${c.impressions || 0} impressions, ${c.likes || 0} likes, ${c.shares || 0} shares`)
    .join("\n");

  // Pillar distribution
  const pillarCounts: Record<string, number> = {};
  content.forEach((c) => {
    const p = String(c.pillar || "uncategorized");
    pillarCounts[p] = (pillarCounts[p] || 0) + 1;
  });
  const pillarBreakdown = Object.entries(pillarCounts)
    .map(([pillar, count]) => `  ${pillar}: ${count} posts`)
    .join("\n");

  // Platform distribution
  const platformCounts: Record<string, number> = {};
  content.forEach((c) => {
    const p = String(c.scheduled_platform || "unknown");
    platformCounts[p] = (platformCounts[p] || 0) + 1;
  });
  const platformBreakdown = Object.entries(platformCounts)
    .map(([platform, count]) => `  ${platform}: ${count} posts`)
    .join("\n");

  return `LAST WEEK'S PERFORMANCE:
Total: ${content.length} posts | ${totalImpressions} impressions | ${totalLikes} likes | ${totalComments} comments | ${totalShares} shares | ${totalClicks} link clicks

Top performers:
${topPerformers}

Pillar distribution:
${pillarBreakdown}

Platform distribution:
${platformBreakdown}

Engagement rate: ${totalImpressions > 0 ? ((totalLikes + totalComments + totalShares) / totalImpressions * 100).toFixed(2) : 0}%`;
}

// ── Build the full strategist prompt ──
function buildStrategistPrompt(ctx: {
  weekStart: string;
  perfSummary: string;
  lastWeekPlan: { plan?: unknown; performance_summary?: string } | null;
  scoutAlerts: Record<string, unknown>[];
  engagedAlerts: Record<string, unknown>[];
}): string {
  const scoutSection = ctx.scoutAlerts.length > 0
    ? `\n## CURRENT SCOUT ALERTS (incorporate these into this week's plan):\n${ctx.scoutAlerts
        .map((a, i) => `${i + 1}. [${a.opportunity_type}] ${a.summary}\n   Suggested content: "${a.suggested_content_topic}"`)
        .join("\n")}`
    : "";

  const engagedSection = ctx.engagedAlerts.length > 0
    ? `\n## TOPICS THAT RESONATED (create more content in these veins):\n${ctx.engagedAlerts
        .map((a, i) => `${i + 1}. [${a.opportunity_type}] ${a.suggested_content_topic || a.summary}`)
        .join("\n")}`
    : "";

  const lastWeekNotes = ctx.lastWeekPlan?.performance_summary
    ? `\n## LAST WEEK'S STRATEGIST NOTES:\n${ctx.lastWeekPlan.performance_summary}`
    : "";

  return `Create the content calendar for the week of ${ctx.weekStart}.

${NASSAU_BRAND_VOICE}

${CONTENT_PILLARS}

## PERFORMANCE DATA:
${ctx.perfSummary}
${lastWeekNotes}
${scoutSection}
${engagedSection}

## PLATFORM CADENCE:
- Instagram: 1 post/day (mix of carousels, reels, single image)
- Twitter/X: 2-3 tweets/day (1 thread per week)
- LinkedIn: 2 posts/week (founder story angle)
- YouTube Shorts: 2/week
- TikTok: 3/week (repurpose reels + original)
- Email: 1/week (Tuesday optimal)

## INSTRUCTIONS:
1. Analyze last week's performance — what worked, what didn't, what pillars are over/under-represented
2. Incorporate relevant scout alerts into this week's plan
3. Ensure all 4 content pillars get representation
4. Every hook must sound like it came from the trip captain's brain, not a marketing team
5. Include specific details — real course names, real dollar amounts, real golf scenarios
6. Flag any time-sensitive opportunities (events, seasonal hooks, trending topics)
7. If last week had low engagement, adjust strategy — try different formats, hooks, or posting times

Return a JSON object:
{
  "theme": "This week's overarching theme or focus",
  "performance_takeaways": "2-3 sentence analysis of what last week's data tells us",
  "strategy_adjustments": "What we're changing this week based on the data",
  "days": [
    {
      "date": "YYYY-MM-DD",
      "slots": [
        {
          "platform": "instagram | twitter | linkedin | youtube | tiktok | email",
          "content_type": "carousel | reel | single_image | tweet | thread | short | post | newsletter",
          "pillar": "pain_points | betting_culture | course_reviews | budget_breakdowns",
          "topic": "Brief topic description",
          "hook": "The actual opening line / hook (write it in Nassau's voice)",
          "notes": "Strategy notes, references to scout alerts, specific angles",
          "time": "Suggested posting time (e.g., 7:30 AM CT)",
          "priority": "high | medium | low"
        }
      ]
    }
  ],
  "weekly_notes": "Any additional strategic notes for the week"
}`;
}
