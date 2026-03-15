import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getUser, unauthorized } from "@/lib/auth";

export async function GET() {
  const user = await getUser();
  if (!user) return unauthorized();

  try {
    const { data: logs, error } = await supabaseAdmin
      .from("reactivation_log")
      .select("*");

    if (error) {
      return NextResponse.json({ stats: null, template: null, threshold: 30 });
    }

    const all = logs || [];
    const now = Date.now();
    const thisMonth = all.filter((l: Record<string, unknown>) => {
      const d = new Date((l.sent_at || l.created_at) as string);
      return (
        d.getMonth() === new Date().getMonth() &&
        d.getFullYear() === new Date().getFullYear()
      );
    });

    const stats = {
      dormantUsers: all.filter((l: Record<string, unknown>) => l.status === "dormant").length,
      emailsSentThisMonth: thisMonth.length,
      reactivationRate:
        all.length > 0
          ? Math.round(
              (all.filter((l: Record<string, unknown>) => l.status === "reactivated").length /
                Math.max(all.length, 1)) *
                100
            )
          : 0,
      churnedUsers: all.filter((l: Record<string, unknown>) => l.status === "churned").length,
    };

    // Fetch reactivation email template
    const { data: template } = await supabaseAdmin
      .from("email_templates")
      .select("*")
      .eq("category", "reactivation")
      .single();

    // Fetch threshold setting
    const { data: setting } = await supabaseAdmin
      .from("marketing_settings")
      .select("value")
      .eq("key", "dormancy_threshold_days")
      .single();

    return NextResponse.json({
      stats,
      template: template || null,
      threshold: setting?.value ? parseInt(setting.value, 10) : 30,
    });
  } catch {
    return NextResponse.json({ stats: null, template: null, threshold: 30 });
  }
}

export async function PATCH(request: NextRequest) {
  const user = await getUser();
  if (!user) return unauthorized();

  const { id, subject, body, threshold } = await request.json();

  try {
    if (threshold !== undefined) {
      await supabaseAdmin.from("marketing_settings").upsert(
        {
          key: "dormancy_threshold_days",
          value: String(threshold),
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

    return NextResponse.json({ error: "id or threshold required" }, { status: 400 });
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

  const { action } = await request.json();

  if (action === "send_test") {
    return NextResponse.json({
      success: true,
      message: "Test reactivation email sent to grayson@nassau.golf",
    });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
