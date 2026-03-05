import { NextRequest, NextResponse } from "next/server";
import { requireMarketingAdmin } from "@/lib/marketing-auth";
import { createServiceClient } from "@/lib/supabase/admin";
import { callClaude, extractJSON } from "@/lib/marketing-claude";
import { DESIGNER_PROMPT } from "@/lib/marketing-prompts";

export async function POST(req: NextRequest) {
  try {
    const auth = await requireMarketingAdmin();
    if (!auth.authorized) return auth.response;

    const body = await req.json();
    const { contentId } = body;

    if (!contentId) {
      return NextResponse.json(
        { error: "contentId is required" },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    // Fetch content
    const { data: content, error: fetchError } = await supabase
      .from("marketing_content")
      .select("*")
      .eq("id", contentId)
      .single();

    if (fetchError || !content) {
      return NextResponse.json(
        { error: "Content not found" },
        { status: 404 }
      );
    }

    const prompt = `Create a visual brief for this content:

TITLE: ${content.title}
TOPIC: ${content.topic}
PILLAR: ${content.pillar}

INSTAGRAM CAPTION: ${content.instagram_caption || "N/A"}
INSTAGRAM CAROUSEL: ${JSON.stringify(content.instagram_carousel) || "N/A"}
TWITTER STANDALONE: ${content.twitter_standalone || "N/A"}
LINKEDIN POST: ${content.linkedin_post || "N/A"}

Produce a visual brief as JSON with slides array.`;

    const response = await callClaude({
      system: DESIGNER_PROMPT,
      messages: [{ role: "user", content: prompt }],
    });

    const brief = extractJSON(response);

    // Update marketing_content.visual_brief
    const { error: updateError } = await supabase
      .from("marketing_content")
      .update({ visual_brief: brief, updated_at: new Date().toISOString() })
      .eq("id", contentId);

    if (updateError) {
      console.error("[designer] Failed to update visual brief:", updateError);
      return NextResponse.json(
        { error: "Failed to save visual brief" },
        { status: 500 }
      );
    }

    return NextResponse.json({ brief });
  } catch (error) {
    console.error("[designer] Error:", error);
    return NextResponse.json(
      { error: "Designer agent failed" },
      { status: 500 }
    );
  }
}
