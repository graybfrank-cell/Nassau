import { NextResponse } from "next/server";
import { requireMarketingAdmin } from "@/lib/marketing-auth";
import { createServiceClient } from "@/lib/supabase/admin";
import { callClaude, extractJSON } from "@/lib/marketing-claude";
import { SCOUT_PROMPT } from "@/lib/marketing-prompts";

export async function POST() {
  try {
    const auth = await requireMarketingAdmin();
    if (!auth.authorized) return auth.response;

    const supabase = createServiceClient();

    const response = await callClaude({
      system: SCOUT_PROMPT,
      messages: [
        {
          role: "user",
          content: `Scan the internet for content opportunities for Nassau (nassau.golf). Today is ${new Date().toISOString().split("T")[0]}. Find 3-8 opportunities across Reddit, Twitter/X, and Google Trends related to golf trips, golf travel, group golf coordination, and golf betting games.`,
        },
      ],
      tools: [{ type: "web_search_20250305", name: "web_search" }],
    });

    let alerts: unknown[];
    try {
      const parsed = extractJSON(response);
      alerts = Array.isArray(parsed) ? parsed : [];
    } catch {
      console.error("[scout] Failed to parse alerts from response");
      alerts = [];
    }

    // Save alerts to marketing_scout_alerts
    const savedAlerts = [];
    for (const alert of alerts) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const a = alert as any;
      const { data, error } = await supabase
        .from("marketing_scout_alerts")
        .insert({
          source: a.source || "unknown",
          url: a.url || null,
          summary: a.summary || "",
          opportunity_type: a.opportunity_type || null,
          suggested_response: a.suggested_response || null,
          suggested_content_topic: a.suggested_content_topic || null,
          status: "new",
        })
        .select()
        .single();

      if (error) {
        console.error("[scout] Failed to save alert:", error);
      } else {
        savedAlerts.push(data);
      }
    }

    return NextResponse.json({ alerts: savedAlerts });
  } catch (error) {
    console.error("[scout] Error:", error);
    return NextResponse.json(
      { error: "Scout agent failed" },
      { status: 500 }
    );
  }
}
