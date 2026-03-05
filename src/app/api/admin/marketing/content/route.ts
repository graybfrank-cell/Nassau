import { NextRequest, NextResponse } from "next/server";
import { requireMarketingAdmin } from "@/lib/marketing-auth";
import { createServiceClient } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireMarketingAdmin();
    if (!auth.authorized) return auth.response;

    const supabase = createServiceClient();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const pillar = searchParams.get("pillar");
    const platform = searchParams.get("platform");

    let query = supabase
      .from("marketing_content")
      .select("*")
      .order("created_at", { ascending: false });

    if (status) query = query.eq("status", status);
    if (pillar) query = query.eq("pillar", pillar);
    if (platform) query = query.eq("scheduled_platform", platform);

    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("[content] GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch content" },
      { status: 500 }
    );
  }
}
