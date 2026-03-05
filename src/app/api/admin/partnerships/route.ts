import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getUser, unauthorized } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const user = await getUser();
  if (!user) return unauthorized();

  const url = request.nextUrl;
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = parseInt(url.searchParams.get("limit") || "25");
  const search = url.searchParams.get("search") || "";
  const filter = url.searchParams.get("filter") || "all";
  const sortBy = url.searchParams.get("sortBy") || "destination";
  const sortDir = url.searchParams.get("sortDir") === "desc";

  try {
    // Build the main query
    let query = supabaseAdmin.from("marketing_partnerships").select("*", { count: "exact" });

    // Search filter
    if (search) {
      query = query.or(
        `course_name.ilike.%${search}%,destination.ilike.%${search}%`
      );
    }

    // Status/contact filters — use outreach_status column
    switch (filter) {
      case "no_contact":
        query = query.is("marketing_contact_email", null).is("booking_email", null);
        break;
      case "has_email":
        query = query.or(
          "marketing_contact_email.not.is.null,booking_email.not.is.null"
        );
        break;
      case "needs_review":
        query = query.eq("needs_review", true);
        break;
      case "contacted":
        query = query.eq("outreach_status", "contacted");
        break;
      case "replied":
        query = query.eq("outreach_status", "replied");
        break;
    }

    // Sorting — map frontend field names to actual column names
    let orderColumn = "destination";
    if (sortBy === "tier") orderColumn = "tier";
    else if (sortBy === "status") orderColumn = "outreach_status";
    else if (sortBy === "updated") orderColumn = "updated_at";
    query = query.order(orderColumn, { ascending: !sortDir });

    // Pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: partnerships, count, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const total = count || 0;

    // Get stats — run in parallel
    const [totalRes, emailRes, contactedRes, repliedRes, activeRes] = await Promise.all([
      supabaseAdmin.from("marketing_partnerships").select("*", { count: "exact", head: true }),
      supabaseAdmin
        .from("marketing_partnerships")
        .select("*", { count: "exact", head: true })
        .or("marketing_contact_email.not.is.null,booking_email.not.is.null"),
      supabaseAdmin
        .from("marketing_partnerships")
        .select("*", { count: "exact", head: true })
        .eq("outreach_status", "contacted"),
      supabaseAdmin
        .from("marketing_partnerships")
        .select("*", { count: "exact", head: true })
        .eq("outreach_status", "replied"),
      supabaseAdmin
        .from("marketing_partnerships")
        .select("*", { count: "exact", head: true })
        .eq("outreach_status", "active"),
    ]);

    return NextResponse.json({
      partnerships: partnerships || [],
      total,
      page,
      totalPages: Math.ceil(total / limit),
      stats: {
        totalCourses: totalRes.count || 0,
        hasEmail: emailRes.count || 0,
        contacted: contactedRes.count || 0,
        replied: repliedRes.count || 0,
        active: activeRes.count || 0,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch partnerships" },
      { status: 500 }
    );
  }
}
