import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getUser, unauthorized } from "@/lib/auth";

export async function GET() {
  const user = await getUser();
  if (!user) return unauthorized();

  try {
    const { data, error } = await supabaseAdmin
      .from("marketing_content")
      .select("*")
      .order("updated_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Group by status for Kanban columns
    const columns: Record<string, typeof data> = {
      idea: [],
      draft: [],
      review: [],
      approved: [],
      scheduled: [],
      published: [],
    };

    for (const item of data || []) {
      const status = (item.status || "idea").toLowerCase();
      if (columns[status]) {
        columns[status].push(item);
      } else {
        columns.idea.push(item);
      }
    }

    return NextResponse.json({ columns, total: (data || []).length });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch pipeline" },
      { status: 500 }
    );
  }
}
