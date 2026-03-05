import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY not configured" },
      { status: 500 }
    );
  }

  try {
    // ── Step 1: Pull feedback data (engaged vs dismissed alerts) ──
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

    // ── Step 2: Pull recent top-performing content for context ──
    const { data: topContent } = await supabaseAdmin
      .from("marketing_content")
      .select("title, type, status, impressions, likes, shares")
      .order("impressions", { ascending: false })
      .limit(5);

    // ── Step 3: Build dynamic prompt with feedback ──
    const feedbackContext = buildFeedbackContext(
      engagedAlerts || [],
      dismissedAlerts || [],
      topContent || []
    );

    const prompt = buildScoutPrompt(feedbackContext);

    // ── Step 4: Call Claude with web search ──
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

    // ── Step 5: Extract JSON from response (handle tool_use blocks) ──
    const textContent = data.content
      .filter((block: { type: string }) => block.type === "text")
      .map((block: { text: string }) => block.text)
      .join("\n");

    const clean = textContent.replace(/```json|```/g, "").trim();

    // Try to find JSON array in the response
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

    // ── Step 6: Map to correct DB columns and insert ──
    const now = new Date().toISOString();
    const rows = alerts.map((alert) => ({
      source: String(alert.source || "Scout Agent"),
      url: alert.url || alert.source_url || null,
      summary: String(alert.summary || alert.description || ""),
      opportunity_type: String(alert.opportunity_type || alert.type || "content"),
      suggested_response: alert.suggested_response || null,
      suggested_content_topic: alert.suggested_content_topic || alert.title || null,
      status: "new",
      created_at: now,
    }));

    // Filter out rows with empty summaries
    const validRows = rows.filter((r) => r.summary && r.summary.length > 5);

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
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Scout agent failed" },
      { status: 500 }
    );
  }
}

// ── Helper: Build feedback context string ──
function buildFeedbackContext(
  engaged: Record<string, unknown>[],
  dismissed: Record<string, unknown>[],
  topContent: Record<string, unknown>[]
): string {
  const sections: string[] = [];

  if (engaged.length > 0) {
    sections.push(
      `## ALERTS THE TEAM ENGAGED WITH (find MORE like these):\n${engaged
        .map(
          (a, i) =>
            `${i + 1}. [${a.opportunity_type}] ${a.summary}${a.suggested_content_topic ? ` → Content: "${a.suggested_content_topic}"` : ""}`
        )
        .join("\n")}`
    );
  }

  if (dismissed.length > 0) {
    sections.push(
      `## ALERTS THE TEAM DISMISSED (find FEWER like these):\n${dismissed
        .map(
          (a, i) =>
            `${i + 1}. [${a.opportunity_type}] ${a.summary}`
        )
        .join("\n")}`
    );
  }

  if (topContent.length > 0) {
    sections.push(
      `## TOP PERFORMING CONTENT (scout for similar opportunities):\n${topContent
        .map(
          (c, i) =>
            `${i + 1}. "${c.title}" (${c.type}) — ${c.impressions || 0} impressions, ${c.likes || 0} likes, ${c.shares || 0} shares`
        )
        .join("\n")}`
    );
  }

  return sections.length > 0
    ? `\n\n--- FEEDBACK FROM PAST PERFORMANCE ---\n${sections.join("\n\n")}\n--- END FEEDBACK ---\n\nUse this feedback to calibrate your recommendations. Find opportunities similar to what was engaged with, avoid topics similar to what was dismissed, and look for angles that could replicate top-performing content.\n`
    : "";
}

// ── Helper: Build the full Scout prompt ──
function buildScoutPrompt(feedbackContext: string): string {
  return `You are the Scout Agent for Nassau (nassau.golf), a golf trip planning and round tracking app. Your job is to scan the golf world for marketing opportunities — trending topics, upcoming events, viral moments, partnership leads, content ideas, and industry news that Nassau could capitalize on.

Search the web for:
1. Trending golf topics on social media (Reddit r/golf, Twitter/X #golf, TikTok #GolfTok)
2. Upcoming golf events or tournaments relevant to amateur golfers
3. New golf courses opening or major renovations
4. Golf influencer activity or viral golf content
5. Seasonal opportunities (spring golf trip planning, holiday gift guides, etc.)
6. Golf trip planning pain points being discussed in forums
7. Competitor moves — other golf apps, trip planning tools, group coordination apps
8. Golf travel trends — destination popularity shifts, new packages, deals
${feedbackContext}

Return ONLY a JSON array of 5-8 alerts with no other text:

[
  {
    "source": "Where you found this (e.g., Reddit r/golf, Golf Digest, X/Twitter trending)",
    "url": "https://example.com/article-or-thread-link",
    "summary": "2-3 sentence explanation of the opportunity and why it matters for Nassau's growth",
    "opportunity_type": "content_idea | engage | trending | partnership | competitor | seasonal",
    "suggested_response": "1-2 sentence suggested action Nassau should take (e.g., 'Reply to this thread with trip planning tips and soft CTA')",
    "suggested_content_topic": "Specific content piece title this could become (e.g., 'Why Bandon Dunes Requires 18 Months of Planning')"
  }
]

Guidelines:
- Every field is REQUIRED — especially "summary" and "suggested_content_topic"
- Focus on opportunities actionable within the next 1-2 weeks
- Prioritize things relevant to golf trip planning, group golf coordination, and amateur golfers
- Be specific — reference actual posts, articles, threads, or trends you find via web search
- Include direct URLs when possible
- "opportunity_type" determines how the team acts on it:
  - content_idea = create original content inspired by this
  - engage = respond to or participate in this conversation
  - trending = ride this trending wave with timely content
  - partnership = potential course/brand partnership opportunity
  - competitor = something a competitor is doing we should respond to
  - seasonal = time-sensitive seasonal opportunity`;
}
