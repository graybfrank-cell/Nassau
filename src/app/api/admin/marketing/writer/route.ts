import { NextRequest, NextResponse } from "next/server";
import { requireMarketingAdmin } from "@/lib/marketing-auth";
import { createServiceClient } from "@/lib/supabase/admin";
import { callClaude, extractJSON } from "@/lib/marketing-claude";
import { WRITER_PROMPT } from "@/lib/marketing-prompts";
import { findDestination } from "@/lib/marketing-kb";

export async function POST(req: NextRequest) {
  try {
    const auth = await requireMarketingAdmin();
    if (!auth.authorized) return auth.response;

    const body = await req.json();
    const { topic, pillar, format, notes, destinationId } = body;

    if (!topic) {
      return NextResponse.json(
        { error: "topic is required" },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    // If destinationId provided, fetch KB data
    let kbContext = "";
    if (destinationId) {
      const destination = findDestination(destinationId);
      if (destination) {
        kbContext = `\n\nDESTINATION DATA FROM NASSAU KB:\n${JSON.stringify(destination, null, 2)}`;
      }
    }

    const prompt = `Create content for the following assignment:

TOPIC: ${topic}
PILLAR: ${pillar || "general"}
FORMAT: ${format || "all"}
NOTES: ${notes || "none"}
${kbContext}

Produce all platform variants as JSON matching the marketing_content table columns.`;

    const response = await callClaude({
      system: WRITER_PROMPT,
      messages: [{ role: "user", content: prompt }],
    });

    const content = extractJSON(response);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const c = content as any;

    // Save to marketing_content
    const { data: saved, error } = await supabase
      .from("marketing_content")
      .insert({
        title: c.title || topic,
        topic: topic,
        pillar: pillar || c.pillar || "general",
        source_agent: "writer",
        status: "draft",
        instagram_caption: c.instagram_caption || null,
        instagram_carousel: c.instagram_carousel || null,
        instagram_reel_script: c.instagram_reel_script || null,
        twitter_thread: c.twitter_thread || null,
        twitter_standalone: c.twitter_standalone || null,
        linkedin_post: c.linkedin_post || null,
        youtube_short_script: c.youtube_short_script || null,
        email_segment: c.email_segment || null,
      })
      .select()
      .single();

    if (error) {
      console.error("[writer] Failed to save content:", error);
      return NextResponse.json({ error: "Failed to save content" }, { status: 500 });
    }

    // Auto-call designer for visual brief
    try {
      const designerUrl = new URL(
        "/api/admin/marketing/designer",
        req.nextUrl.origin
      );
      await fetch(designerUrl.toString(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: req.headers.get("cookie") || "",
        },
        body: JSON.stringify({ contentId: saved.id }),
      });
    } catch (designerError) {
      console.error("[writer] Designer auto-call failed:", designerError);
    }

    return NextResponse.json({ content: saved });
  } catch (error) {
    console.error("[writer] Error:", error);
    return NextResponse.json(
      { error: "Writer agent failed" },
      { status: 500 }
    );
  }
}
