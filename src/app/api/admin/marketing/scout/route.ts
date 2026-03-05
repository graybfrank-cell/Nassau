import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getUser, unauthorized } from "@/lib/auth";

export async function GET() {
  const user = await getUser();
  if (!user) return unauthorized();

  try {
    const { data, error } = await supabaseAdmin
      .from("marketing_scout_alerts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ alerts: data || [] });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch alerts" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const user = await getUser();
  if (!user) return unauthorized();

  const { id, action } = await request.json();

  if (!id || !action) {
    return NextResponse.json({ error: "id and action required" }, { status: 400 });
  }

  try {
    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (action === "dismiss") {
      updateData.status = "dismissed";
    } else if (action === "engage") {
      updateData.status = "engaged";
    } else if (action === "create") {
      updateData.status = "content_created";
    }

    const { data, error } = await supabaseAdmin
      .from("marketing_scout_alerts")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update alert" },
      { status: 500 }
    );
  }
}
