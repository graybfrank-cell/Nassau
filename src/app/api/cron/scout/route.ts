import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { SCOUT_AGENT_PROMPT } from "@/lib/marketing-prompts";

export async function POST() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY not configured" },
      { status: 500 }
    );
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2000,
        tools: [{ type: "web_search_20250305", name: "web_search" }],
        messages: [{ role: "user", content: SCOUT_AGENT_PROMPT }],
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
      .join("");

    const clean = textContent.replace(/```json|```/g, "").trim();
    const alerts = JSON.parse(clean);

    if (!Array.isArray(alerts)) {
      return NextResponse.json(
        { error: "Expected array of alerts", raw: textContent },
        { status: 500 }
      );
    }

    const now = new Date().toISOString();
    const rows = alerts.map((alert: Record<string, unknown>) => ({
      title: alert.title || "Untitled Alert",
      description: alert.description || null,
      type: alert.type || null,
      source: alert.source || null,
      source_url: alert.source_url || null,
      relevance_score: alert.relevance_score ?? null,
      status: "new",
      created_at: now,
      updated_at: now,
    }));

    const { error: insertError } = await supabaseAdmin
      .from("marketing_scout_alerts")
      .insert(rows);

    if (insertError) {
      return NextResponse.json(
        { error: `Insert failed: ${insertError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, alertsCreated: rows.length });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Scout agent failed" },
      { status: 500 }
    );
  }
}
