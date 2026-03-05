import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getUser, unauthorized } from "@/lib/auth";

export async function GET() {
  const user = await getUser();
  if (!user) return unauthorized();

  try {
    const { data, error } = await supabaseAdmin
      .from("marketing_weekly_plans")
      .select("*")
      .order("week_start", { ascending: false })
      .limit(8);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ plans: data || [] });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch calendar" },
      { status: 500 }
    );
  }
}
