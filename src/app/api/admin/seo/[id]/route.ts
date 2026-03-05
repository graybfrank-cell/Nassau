import { NextRequest, NextResponse } from "next/server";
import { requireMarketingAdmin } from "@/lib/marketing-auth";
import { createServiceClient } from "@/lib/supabase/admin";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, ctx: RouteContext) {
  try {
    const auth = await requireMarketingAdmin();
    if (!auth.authorized) return auth.response;

    const { id } = await ctx.params;
    const supabase = createServiceClient();

    const { data: post, error } = await supabase
      .from("seo_blog_posts")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    return NextResponse.json({ post });
  } catch (error) {
    console.error("[seo/id] GET error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

export async function PATCH(req: NextRequest, ctx: RouteContext) {
  try {
    const auth = await requireMarketingAdmin();
    if (!auth.authorized) return auth.response;

    const { id } = await ctx.params;
    const body = await req.json();
    const supabase = createServiceClient();

    // Build update object from provided fields
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const update: Record<string, any> = { updated_at: new Date().toISOString() };

    const allowedFields = [
      "title",
      "slug",
      "meta_description",
      "target_keyword",
      "secondary_keywords",
      "tags",
      "content_markdown",
      "featured_image_url",
      "featured_image_alt",
      "author_name",
      "author_title",
      "status",
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        update[field] = body[field];
      }
    }

    // Auto-calculate word count if content changed
    if (body.content_markdown) {
      const wordCount = body.content_markdown
        .replace(/[#*_\[\]()]/g, "")
        .split(/\s+/)
        .filter(Boolean).length;
      update.word_count = wordCount;
      update.reading_time_minutes = Math.ceil(wordCount / 200);
    }

    // Auto-generate slug if setting to published and slug is empty
    if (body.status === "published") {
      update.published_at = new Date().toISOString();

      // Check if slug exists, generate if not
      const { data: current } = await supabase
        .from("seo_blog_posts")
        .select("slug, title")
        .eq("id", id)
        .single();

      if (current && !current.slug) {
        update.slug = generateSlug(body.title || current.title);
      }
    }

    const { data: post, error } = await supabase
      .from("seo_blog_posts")
      .update(update)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("[seo/id] PATCH error:", error);
      return NextResponse.json({ error: "Failed to update post" }, { status: 500 });
    }

    return NextResponse.json({ post });
  } catch (error) {
    console.error("[seo/id] PATCH error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, ctx: RouteContext) {
  try {
    const auth = await requireMarketingAdmin();
    if (!auth.authorized) return auth.response;

    const { id } = await ctx.params;
    const supabase = createServiceClient();

    const { error } = await supabase
      .from("seo_blog_posts")
      .update({ status: "deleted", updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      console.error("[seo/id] DELETE error:", error);
      return NextResponse.json({ error: "Failed to delete post" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[seo/id] DELETE error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
