import { NextResponse } from "next/server";
import { requireMarketingAdmin } from "@/lib/marketing-auth";
import { createServiceClient } from "@/lib/supabase/admin";

export async function POST() {
  try {
    const auth = await requireMarketingAdmin();
    if (!auth.authorized) return auth.response;

    const supabase = createServiceClient();
    let processed = 0;

    // Get all referral codes with their referral counts
    const { data: codes, error: codesError } = await supabase
      .from("referral_codes")
      .select("user_id, code, clicks");

    if (codesError) {
      console.error("[referral-tracker] Error fetching codes:", codesError);
      return NextResponse.json({ error: "Failed to fetch referral codes" }, { status: 500 });
    }

    const stats: { user_id: string; code: string; total_referrals: number; active_referrals: number }[] = [];

    for (const rc of codes || []) {
      // Count total referrals for this code
      const { count: totalReferrals } = await supabase
        .from("referrals")
        .select("id", { count: "exact", head: true })
        .eq("referral_code", rc.code);

      // Count active referrals (referred users who created a trip or round)
      const { data: referredUsers } = await supabase
        .from("referrals")
        .select("referred_id")
        .eq("referral_code", rc.code);

      let activeCount = 0;
      for (const ref of referredUsers || []) {
        // Check if referred user has trips
        const { count: tripCount } = await supabase
          .from("trips")
          .select("id", { count: "exact", head: true })
          .eq("created_by", ref.referred_id);

        // Check if referred user has rounds
        const { count: roundCount } = await supabase
          .from("rounds")
          .select("id", { count: "exact", head: true })
          .eq("created_by", ref.referred_id);

        if ((tripCount || 0) > 0 || (roundCount || 0) > 0) {
          activeCount++;
        }
      }

      stats.push({
        user_id: rc.user_id,
        code: rc.code,
        total_referrals: totalReferrals || 0,
        active_referrals: activeCount,
      });
      processed++;
    }

    // Find top 10 referrers this week
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: weeklyReferrals } = await supabase
      .from("referrals")
      .select("referral_code")
      .gte("signed_up_at", oneWeekAgo);

    const weeklyByCode: Record<string, number> = {};
    for (const r of weeklyReferrals || []) {
      weeklyByCode[r.referral_code] = (weeklyByCode[r.referral_code] || 0) + 1;
    }

    // Log summary to marketing_performance
    const totalReferrals = stats.reduce((sum, s) => sum + s.total_referrals, 0);
    const totalActive = stats.reduce((sum, s) => sum + s.active_referrals, 0);

    await supabase.from("marketing_performance").insert({
      metric_date: new Date().toISOString().split("T")[0],
      platform: "referral",
      pillar: "growth",
      format: "referral",
      impressions: stats.length,
      likes: totalReferrals,
      comments: totalActive,
      shares: Object.values(weeklyByCode).reduce((a, b) => a + b, 0),
      saves: 0,
      link_clicks: codes?.reduce((sum, c) => sum + (c.clicks || 0), 0) || 0,
    });

    return NextResponse.json({
      success: true,
      processed,
      total_referrers: stats.length,
      total_referrals: totalReferrals,
      active_referrals: totalActive,
      weekly_referrals: Object.values(weeklyByCode).reduce((a, b) => a + b, 0),
    });
  } catch (error) {
    console.error("[referral-tracker] Error:", error);
    return NextResponse.json({ error: "Referral tracker failed" }, { status: 500 });
  }
}
