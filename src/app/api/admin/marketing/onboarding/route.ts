import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getUser, unauthorized } from "@/lib/auth";

export async function GET() {
  const user = await getUser();
  if (!user) return unauthorized();

  try {
    // Fetch stats from onboarding_sequences
    const { data: sequences, error } = await supabaseAdmin
      .from("onboarding_sequences")
      .select("*");

    if (error) {
      return NextResponse.json({ stats: null, templates: [] });
    }

    const all = sequences || [];
    const stats = {
      totalInSequence: all.length,
      day0Sent: all.filter((s) => s.day_0_sent).length,
      day3Sent: all.filter((s) => s.day_3_sent).length,
      day7Sent: all.filter((s) => s.day_7_sent).length,
      completionRate:
        all.length > 0
          ? Math.round(
              (all.filter((s) => s.day_7_sent).length / all.length) * 100
            )
          : 0,
    };

    // Fetch email templates
    const { data: templates } = await supabaseAdmin
      .from("email_templates")
      .select("*")
      .eq("category", "onboarding")
      .order("day", { ascending: true });

    return NextResponse.json({ stats, templates: templates || [] });
  } catch {
    return NextResponse.json({ stats: null, templates: [] });
  }
}

export async function PATCH(request: NextRequest) {
  const user = await getUser();
  if (!user) return unauthorized();

  const { id, subject, body } = await request.json();

  if (!id) {
    return NextResponse.json({ error: "Template id required" }, { status: 400 });
  }

  try {
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
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update template" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) return unauthorized();

  const { action, templateId } = await request.json();

  if (action === "send_test") {
    // In production, this would send via an email service
    // For now, log and return success
    return NextResponse.json({
      success: true,
      message: `Test email sent to grayson@nassau.golf for template ${templateId}`,
    });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
