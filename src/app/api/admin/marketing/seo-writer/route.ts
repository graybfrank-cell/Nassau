import { NextRequest, NextResponse } from "next/server";
import { requireMarketingAdmin } from "@/lib/marketing-auth";
import { createServiceClient } from "@/lib/supabase/admin";
import { callClaude, extractJSON } from "@/lib/marketing-claude";
import { SEO_WRITER_AGENT_PROMPT } from "@/lib/marketing-prompts";

const SEED_KEYWORDS = [
  "best golf trips in Arizona",
  "best golf trips in South Carolina",
  "best golf trips in Florida",
  "golf trip planning guide",
  "golf trip itinerary Scottsdale",
  "golf trip itinerary Myrtle Beach",
  "Pinehurst golf courses ranked",
  "Scottsdale golf courses ranked",
  "nassau bet rules golf",
  "skins game golf how to play",
  "golf trip packing list",
  "how to organize a golf trip",
  "best golf trips in Texas",
  "golf trip budget breakdown",
  "best golf destinations for groups",
  "golf trip itinerary Bandon Dunes",
];

export async function POST(req: NextRequest) {
  try {
    const auth = await requireMarketingAdmin();
    if (!auth.authorized) return auth.response;

    const supabase = createServiceClient();

    // Check if manual trigger with keyword
    let keyword: string | undefined;
    try {
      const body = await req.json();
      keyword = body.keyword;
    } catch {
      // No body — cron trigger, pick next keyword
    }

    if (!keyword) {
      // Pick a keyword that hasn't been used yet
      const { data: usedKeywords } = await supabase
        .from("seo_blog_posts")
        .select("target_keyword");

      const used = new Set((usedKeywords || []).map((k) => k.target_keyword));
      const available = SEED_KEYWORDS.filter((k) => !used.has(k));
      keyword = available.length > 0 ? available[0] : SEED_KEYWORDS[Math.floor(Math.random() * SEED_KEYWORDS.length)];
    }

    // Generate blog post via Claude with web search
    const response = await callClaude({
      system: SEO_WRITER_AGENT_PROMPT,
      messages: [
        {
          role: "user",
          content: `Write a comprehensive blog post targeting the keyword: "${keyword}". Use web search to research current, accurate information about courses, prices, and conditions. Return the result as JSON.`,
        },
      ],
      tools: [{ type: "web_search_20250305", name: "web_search" }],
      maxTokens: 8192,
    });

    const post = extractJSON(response) as {
      title: string;
      slug: string;
      meta_description: string;
      target_keyword: string;
      secondary_keywords: string[];
      content_markdown: string;
    };

    // Calculate word count
    const wordCount = post.content_markdown
      .replace(/[#*_\[\]()]/g, "")
      .split(/\s+/)
      .filter(Boolean).length;

    // Save to database
    const { data: saved, error } = await supabase
      .from("seo_blog_posts")
      .insert({
        title: post.title,
        slug: post.slug,
        meta_description: post.meta_description,
        target_keyword: post.target_keyword || keyword,
        secondary_keywords: post.secondary_keywords || [],
        content_markdown: post.content_markdown,
        word_count: wordCount,
        status: "draft",
      })
      .select()
      .single();

    if (error) {
      console.error("[seo-writer] Failed to save post:", error);
      return NextResponse.json({ error: "Failed to save post" }, { status: 500 });
    }

    // Notify admin via email
    try {
      await resend.emails.send({
        from: "Nassau <hey@nassau.golf>",
        to: "graybfrank@gmail.com",
        subject: `[SEO] New draft: ${post.title}`,
        text: `A new blog post has been generated:\n\nTitle: ${post.title}\nKeyword: ${keyword}\nWord count: ${wordCount}\n\nReview it in the Marketing Command Center > SEO tab.`,
      });
    } catch (emailError) {
      console.error("[seo-writer] Notification email failed:", emailError);
    }

    return NextResponse.json({
      success: true,
      post: saved,
    });
  } catch (error) {
    console.error("[seo-writer] Error:", error);
    return NextResponse.json({ error: "SEO Writer agent failed" }, { status: 500 });
  }
}

// GET endpoint for fetching all posts
export async function GET() {
  try {
    const auth = await requireMarketingAdmin();
    if (!auth.authorized) return auth.response;

    const supabase = createServiceClient();

    const { data: posts, error } = await supabase
      .from("seo_blog_posts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[seo-writer] Error fetching posts:", error);
      return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 });
    }

    return NextResponse.json({ posts: posts || [] });
  } catch (error) {
    console.error("[seo-writer] GET error:", error);
    return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 });
  }
}

// PATCH endpoint for updating post status
export async function PATCH(req: NextRequest) {
  try {
    const auth = await requireMarketingAdmin();
    if (!auth.authorized) return auth.response;

    const { id, status } = await req.json();
    if (!id || !status) {
      return NextResponse.json({ error: "id and status required" }, { status: 400 });
    }

    const supabase = createServiceClient();

    const updateData: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === "published") {
      updateData.published_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from("seo_blog_posts")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("[seo-writer] Update error:", error);
      return NextResponse.json({ error: "Failed to update post" }, { status: 500 });
    }

    return NextResponse.json({ post: data });
  } catch (error) {
    console.error("[seo-writer] PATCH error:", error);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}
