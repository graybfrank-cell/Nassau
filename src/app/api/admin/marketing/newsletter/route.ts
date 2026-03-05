import { NextRequest, NextResponse } from "next/server";
import { requireMarketingAdmin } from "@/lib/marketing-auth";
import { createServiceClient } from "@/lib/supabase/admin";
import { callClaude, extractJSON } from "@/lib/marketing-claude";
import { NEWSLETTER_PROMPT } from "@/lib/marketing-prompts";
import { loadKnowledgeBase } from "@/lib/marketing-kb";

export async function POST(req: NextRequest) {
  try {
    const auth = await requireMarketingAdmin();
    if (!auth.authorized) return auth.response;

    const body = await req.json().catch(() => ({}));
    const { featuredDestinationId } = body;

    const supabase = createServiceClient();

    // Fetch this week's scout alerts
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const { data: alerts } = await supabase
      .from("marketing_scout_alerts")
      .select("*")
      .gte("created_at", oneWeekAgo.toISOString())
      .order("created_at", { ascending: false })
      .limit(10);

    // Fetch analyst summary
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
    const { data: weeklyPlan } = await supabase
      .from("marketing_weekly_plans")
      .select("performance_summary")
      .eq("week_start", weekStart.toISOString().split("T")[0])
      .single();

    // Fetch featured destination from KB
    let destinationData = null;
    const kb = loadKnowledgeBase();
    if (kb) {
      const destinations = kb.destinations || kb;
      if (Array.isArray(destinations) && destinations.length > 0) {
        if (featuredDestinationId) {
          destinationData = destinations.find(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (d: any) =>
              d.id === featuredDestinationId ||
              d.slug === featuredDestinationId
          );
        }
        if (!destinationData) {
          // Rotate weekly based on week number
          const weekNum = Math.floor(
            (Date.now() - new Date("2026-01-01").getTime()) /
              (7 * 86400000)
          );
          destinationData =
            destinations[weekNum % destinations.length];
        }
      }
    }

    const prompt = `Assemble this week's newsletter.

SCOUT ALERTS THIS WEEK:
${JSON.stringify(alerts || [], null, 2)}

ANALYST SUMMARY:
${JSON.stringify(weeklyPlan?.performance_summary || "No data yet", null, 2)}

FEATURED DESTINATION:
${destinationData ? JSON.stringify(destinationData, null, 2) : "No destination data available — suggest one from your knowledge of popular golf destinations."}

Today's date: ${new Date().toISOString().split("T")[0]}

Generate the newsletter draft as JSON.`;

    const response = await callClaude({
      system: NEWSLETTER_PROMPT,
      messages: [{ role: "user", content: prompt }],
    });

    const newsletter = extractJSON(response);

    // Save to marketing_content
    const { data: saved, error } = await supabase
      .from("marketing_content")
      .insert({
        title: "Weekly Newsletter",
        topic: "newsletter",
        pillar: "newsletter",
        source_agent: "newsletter",
        status: "draft",
        instagram_carousel: newsletter, // Store full newsletter data in JSON column
      })
      .select()
      .single();

    if (error) {
      console.error("[newsletter] Failed to save:", error);
    }

    return NextResponse.json({ newsletter, saved });
  } catch (error) {
    console.error("[newsletter] Error:", error);
    return NextResponse.json(
      { error: "Newsletter agent failed" },
      { status: 500 }
    );
  }
}
