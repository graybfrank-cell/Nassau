import { NextResponse } from "next/server";
import { requireMarketingAdmin } from "@/lib/marketing-auth";
import { createServiceClient } from "@/lib/supabase/admin";
import { callClaude, extractJSON } from "@/lib/marketing-claude";
import { STRATEGIST_PROMPT } from "@/lib/marketing-prompts";

export async function POST() {
  try {
    const auth = await requireMarketingAdmin();
    if (!auth.authorized) return auth.response;

    const supabase = createServiceClient();

    // Fetch last week's performance
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const { data: performance } = await supabase
      .from("marketing_performance")
      .select("*")
      .gte("metric_date", oneWeekAgo.toISOString().split("T")[0]);

    // Fetch unacted scout alerts
    const { data: alerts } = await supabase
      .from("marketing_scout_alerts")
      .select("*")
      .eq("status", "new")
      .order("created_at", { ascending: false })
      .limit(20);

    const contextPrompt = `Create this week's content calendar.

LAST WEEK'S PERFORMANCE DATA:
${JSON.stringify(performance || [], null, 2)}

SCOUT ALERTS (unacted):
${JSON.stringify(alerts || [], null, 2)}

Today's date: ${new Date().toISOString().split("T")[0]}

Generate the weekly content plan as JSON.`;

    const response = await callClaude({
      system: STRATEGIST_PROMPT,
      messages: [{ role: "user", content: contextPrompt }],
    });

    const plan = extractJSON(response);

    // Save plan to marketing_weekly_plans
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1); // Monday
    const { data: savedPlan, error: planError } = await supabase
      .from("marketing_weekly_plans")
      .insert({
        week_start: weekStart.toISOString().split("T")[0],
        plan,
      })
      .select()
      .single();

    if (planError) {
      console.error("[strategist] Failed to save plan:", planError);
    }

    // Create marketing_content rows for each slot
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const planObj = plan as any;
    if (planObj?.days) {
      for (const day of planObj.days) {
        if (day.slots) {
          for (const slot of day.slots) {
            await supabase.from("marketing_content").insert({
              title: slot.topic || slot.hook || "Untitled",
              topic: slot.topic || "",
              pillar: slot.pillar || "",
              source_agent: "strategist",
              status: "idea",
              scheduled_platform: slot.platform || "",
              strategist_priority: slot.priority || "medium",
              scheduled_at: day.date
                ? new Date(`${day.date}T12:00:00Z`).toISOString()
                : null,
            });
          }
        }
      }
    }

    return NextResponse.json({ plan: savedPlan, raw: planObj });
  } catch (error) {
    console.error("[strategist] Error:", error);
    return NextResponse.json(
      { error: "Strategist agent failed" },
      { status: 500 }
    );
  }
}
