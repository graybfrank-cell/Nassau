import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getUser, unauthorized } from "@/lib/auth";

export async function GET() {
  const user = await getUser();
  if (!user) return unauthorized();

  try {
    const { data, error } = await supabaseAdmin
      .from("marketing_performance")
      .select("*")
      .order("metric_date", { ascending: false })
      .limit(90);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Aggregate latest metrics
    const latest = data?.[0] || {};
    const metrics = {
      totalViews: latest.total_views || latest.views || 0,
      uniqueVisitors: latest.unique_visitors || latest.visitors || 0,
      signups: latest.signups || 0,
      conversionRate: latest.conversion_rate || 0,
      topReferrers: latest.top_referrers || [],
      topPages: latest.top_pages || [],
    };

    return NextResponse.json({ metrics, history: data || [] });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
