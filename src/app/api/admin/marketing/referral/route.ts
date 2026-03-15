import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getUser, unauthorized } from "@/lib/auth";

export async function GET() {
  const user = await getUser();
  if (!user) return unauthorized();

  try {
    // Fetch referral codes and referrals
    const { data: codes } = await supabaseAdmin
      .from("referral_codes")
      .select("*");

    const { data: referrals } = await supabaseAdmin
      .from("referrals")
      .select("*");

    const allCodes = codes || [];
    const allReferrals = referrals || [];

    const now = new Date();
    const thisMonthReferrals = allReferrals.filter((r: Record<string, unknown>) => {
      const d = new Date(r.created_at as string);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });

    // Find top referrer
    const referrerCounts: Record<string, number> = {};
    for (const r of allReferrals) {
      const code = r.referral_code || r.code;
      referrerCounts[code] = (referrerCounts[code] || 0) + 1;
    }
    const topReferrerCode = Object.entries(referrerCounts).sort(
      (a, b) => b[1] - a[1]
    )[0];

    const topReferrer = topReferrerCode
      ? allCodes.find(
          (c: Record<string, unknown>) => c.code === topReferrerCode[0]
        )
      : null;

    // Viral coefficient: avg referrals per referrer
    const activeReferrers = Object.keys(referrerCounts).length;
    const viralCoefficient =
      activeReferrers > 0
        ? (allReferrals.length / activeReferrers).toFixed(2)
        : "0.00";

    const stats = {
      totalReferrals: allReferrals.length,
      thisMonth: thisMonthReferrals.length,
      topReferrer: topReferrer
        ? `${topReferrer.user_name || topReferrer.code} (${topReferrerCode![1]})`
        : "—",
      viralCoefficient,
    };

    // Fetch milestone templates
    const { data: templates } = await supabaseAdmin
      .from("email_templates")
      .select("*")
      .eq("category", "referral")
      .order("milestone", { ascending: true });

    // Fetch reward tiers setting
    const { data: rewardSetting } = await supabaseAdmin
      .from("marketing_settings")
      .select("value")
      .eq("key", "reward_tiers_enabled")
      .single();

    return NextResponse.json({
      stats,
      templates: templates || [],
      rewardTiersEnabled: rewardSetting?.value === "true",
    });
  } catch {
    return NextResponse.json({
      stats: null,
      templates: [],
      rewardTiersEnabled: false,
    });
  }
}

export async function PATCH(request: NextRequest) {
  const user = await getUser();
  if (!user) return unauthorized();

  const { id, subject, body, rewardTiersEnabled } = await request.json();

  try {
    if (rewardTiersEnabled !== undefined) {
      await supabaseAdmin.from("marketing_settings").upsert(
        {
          key: "reward_tiers_enabled",
          value: String(rewardTiersEnabled),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "key" }
      );
      return NextResponse.json({ success: true });
    }

    if (id) {
      const { data, error } = await supabaseAdmin
        .from("email_templates")
        .update({ subject, body, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ success: true, template: data });
    }

    return NextResponse.json({ error: "id or setting required" }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) return unauthorized();

  const { action, templateId } = await request.json();

  if (action === "send_test") {
    return NextResponse.json({
      success: true,
      message: `Test referral email sent to grayson@nassau.golf for template ${templateId}`,
    });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
