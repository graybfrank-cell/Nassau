import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getUser, unauthorized } from "@/lib/auth";

export async function GET() {
  const user = await getUser();
  if (!user) return unauthorized();

  try {
    const [subscribersRes, sectionsRes] = await Promise.all([
      supabaseAdmin
        .from("newsletter_subscribers")
        .select("*", { count: "exact", head: true }),
      supabaseAdmin
        .from("newsletter_subscribers")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50),
    ]);

    return NextResponse.json({
      subscriberCount: subscribersRes.count || 0,
      subscribers: sectionsRes.data || [],
      error: subscribersRes.error?.message || sectionsRes.error?.message || null,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch newsletter data" },
      { status: 500 }
    );
  }
}
