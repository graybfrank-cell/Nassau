import { NextRequest, NextResponse } from "next/server";
import { getUser, unauthorized } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) return unauthorized();

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY not configured" }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { prompt } = body;

    if (!prompt) {
      return NextResponse.json({ error: "prompt is required" }, { status: 400 });
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        system: `You generate social media visual content configs for Nassau (nassau.golf), a golf trip planning app. 
Voice: trip captain's inner monologue, dry humor, insider golf language.
Respond with ONLY a JSON object, no markdown fences, no preamble:
{
  "template": "stat_card | quote_card | carousel_cover | budget_breakdown | course_spotlight | meme_format | tip_card | recap_card",
  "headline": "The main text (in Nassau's voice)",
  "subtext": "Supporting text",
  "stat": "Key number if applicable",
  "cta": "CTA text or empty string",
  "items": ["Budget line 1: $X", "Line 2: $Y"]
}`,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({ error: `API error: ${response.status}`, details: errorText }, { status: 502 });
    }

    const data = await response.json();
    const text = data.content?.[0]?.text || "";
    const clean = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);

    return NextResponse.json({ success: true, config: parsed });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Generation failed" },
      { status: 500 }
    );
  }
}
