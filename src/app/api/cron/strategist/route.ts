import { NextResponse } from "next/server";
import { requireMarketingAdmin } from "@/lib/marketing-auth";
import { createServiceClient } from "@/lib/supabase/admin";
import { callClaude, extractJSON } from "@/lib/marketing-claude";
import { STRATEGIST_PROMPT } from "@/lib/marketing-prompts";

export async function POST() {
  try {
    console.log("[strategist] Starting...");
    const auth = await requireMarketingAdmin();
    if (!auth.authorized) return auth.response;

    console.log("[strategist] Auth passed");

    let supabase;
    try {
      supabase = createServiceClient();
      console.log("[strategist] Supabase client created");
    } catch (err) {
      console.error("[strategist] Failed to create Supabase client:", err);
      return NextResponse.json(
        { error: "Database connection failed", detail: String(err) },
        { status: 500 }
      );
    }

    // Fetch last week's performance — tolerate table not existing
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const { data: performance, error: perfError } = await supabase
      .from("marketing_performance")
      .select("*")
      .gte("metric_date", oneWeekAgo.toISOString().split("T")[0]);

    if (perfError) {
      console.error(
        "[strategist] Performance query failed:",
        perfError.message,
        perfError.code
      );
    } else {
      console.log(
        `[strategist] Fetched ${performance?.length ?? 0} performance rows`
      );
    }

    // Fetch unacted scout alerts — tolerate table not existing
    const { data: alerts, error: alertsError } = await supabase
      .from("marketing_scout_alerts")
      .select("*")
      .eq("status", "new")
      .order("created_at", { ascending: false })
      .limit(20);

    if (alertsError) {
      console.error(
        "[strategist] Alerts query failed:",
        alertsError.message,
        alertsError.code
      );
    } else {
      console.log(
        `[strategist] Fetched ${alerts?.length ?? 0} scout alerts`
      );
    }

    const contextPrompt = `Create this week's content calendar.

LAST WEEK'S PERFORMANCE DATA:
${JSON.stringify(performance || [], null, 2)}

SCOUT ALERTS (unacted):
${JSON.stringify(alerts || [], null, 2)}

Today's date: ${new Date().toISOString().split("T")[0]}

Generate the weekly content plan as JSON.`;

    console.log("[strategist] Calling Claude API...");

    let response: string;
    try {
      response = await callClaude({
        system: STRATEGIST_PROMPT,
        messages: [{ role: "user", content: contextPrompt }],
      });
      console.log(
        `[strategist] Claude response received (${response.length} chars)`
      );
    } catch (err) {
      console.error("[strategist] Claude API call failed:", err);
      return NextResponse.json(
        { error: "Claude API call failed", detail: String(err) },
        { status: 500 }
      );
    }

    let plan: unknown;
    try {
      plan = extractJSON(response);
      console.log("[strategist] JSON extracted from response");
    } catch (err) {
      console.error(
        "[strategist] Failed to extract JSON from Claude response:",
        err
      );
      console.error(
        "[strategist] Raw response preview:",
        response.slice(0, 500)
      );
      return NextResponse.json(
        {
          error: "Failed to parse strategist response",
          raw_preview: response.slice(0, 300),
        },
        { status: 500 }
      );
    }

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
      console.error(
        "[strategist] Failed to save plan:",
        planError.message,
        planError.code
      );
      // Continue — we still have the plan data to return
    } else {
      console.log("[strategist] Plan saved to marketing_weekly_plans");
    }

    // Create marketing_content rows for each slot
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const planObj = plan as any;
    let slotsCreated = 0;

    if (planObj?.days) {
      for (const day of planObj.days) {
        if (day.slots) {
          for (const slot of day.slots) {
            const { error: slotError } = await supabase
              .from("marketing_content")
              .insert({
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

            if (slotError) {
              console.error(
                "[strategist] Failed to insert content slot:",
                slotError.message
              );
            } else {
              slotsCreated++;
            }
          }
        }
      }
    }

    console.log(`[strategist] Created ${slotsCreated} content slots`);

    return NextResponse.json({ plan: savedPlan || plan, raw: planObj });
  } catch (error) {
    console.error("[strategist] Unhandled error:", error);
    return NextResponse.json(
      {
        error: "Strategist agent failed",
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
