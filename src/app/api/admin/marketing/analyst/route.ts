import { NextResponse } from "next/server";
import { requireMarketingAdmin } from "@/lib/marketing-auth";
import { createServiceClient } from "@/lib/supabase/admin";
import { callClaude, extractJSON } from "@/lib/marketing-claude";
import { ANALYST_PROMPT } from "@/lib/marketing-prompts";

export async function POST() {
  try {
    const auth = await requireMarketingAdmin();
    if (!auth.authorized) return auth.response;

    const supabase = createServiceClient();

    // Fetch published content from this week with performance data
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const { data: content } = await supabase
      .from("marketing_content")
      .select("*")
      .eq("status", "published")
      .gte("published_at", oneWeekAgo.toISOString());

    const { data: performance } = await supabase
      .from("marketing_performance")
      .select("*")
      .gte("metric_date", oneWeekAgo.toISOString().split("T")[0]);

    const prompt = `Analyze this week's marketing performance.

PUBLISHED CONTENT (${(content || []).length} pieces):
${JSON.stringify(content || [], null, 2)}

PERFORMANCE METRICS:
${JSON.stringify(performance || [], null, 2)}

Today's date: ${new Date().toISOString().split("T")[0]}

Provide your analysis as JSON.`;

    const response = await callClaude({
      system: ANALYST_PROMPT,
      messages: [{ role: "user", content: prompt }],
    });

    const analysis = extractJSON(response);

    // Save to current week's marketing_weekly_plans
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
    const weekStartStr = weekStart.toISOString().split("T")[0];

    const { data: existingPlan } = await supabase
      .from("marketing_weekly_plans")
      .select("id")
      .eq("week_start", weekStartStr)
      .single();

    if (existingPlan) {
      await supabase
        .from("marketing_weekly_plans")
        .update({ performance_summary: analysis })
        .eq("id", existingPlan.id);
    }

    return NextResponse.json({ analysis });
  } catch (error) {
    console.error("[analyst] Error:", error);
    return NextResponse.json(
      { error: "Analyst agent failed" },
      { status: 500 }
    );
  }
}
