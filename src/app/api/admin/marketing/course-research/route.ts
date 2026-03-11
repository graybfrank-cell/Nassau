export const maxDuration = 60;
import { NextRequest, NextResponse } from "next/server";
import { requireMarketingAdmin } from "@/lib/marketing-auth";
import { createServiceClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  try {
    const auth = await requireMarketingAdmin();
    if (!auth.authorized) return auth.response;

    const supabase = createServiceClient();
    const body = await request.json();
    const { batch_size = 5, destination } = body;

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "ANTHROPIC_API_KEY not configured" }, { status: 500 });
    }

    // Fetch courses that need research (no website_url or booking_email)
    let query = supabase
      .from("marketing_partnerships")
      .select("id, course_name, destination, region, course_type")
      .is("website_url", null)
      .eq("outreach_status", "not_contacted")
      .limit(batch_size);

    if (destination) {
      query = query.eq("destination", destination);
    }

    const { data: courses, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!courses || courses.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No courses need research",
        researched: 0,
      });
    }

    // Build a batch prompt for all courses
    const courseList = courses
      .map((c: any, i: number) => `${i + 1}. "${c.course_name}" in ${c.destination}`)
      .join("\n");

    const prompt = `Search the web and find the website URL and contact email for each of these golf courses. Look for their official website, then find a booking email, pro shop email, or general contact email from the website.

COURSES TO RESEARCH:
${courseList}

For each course, search for "[course name] golf course official website" and "[course name] golf contact email".

Return ONLY a JSON array with no other text:
[
  {
    "course_name": "Exact course name from above",
    "website_url": "https://their-official-website.com",
    "booking_email": "proshop@course.com or info@course.com or null if not found",
    "clubhouse_phone": "phone number if found or null",
    "marketing_contact_name": "Name of marketing/events director if found on website or null",
    "notes": "Any relevant info found (e.g., 'Part of Troon Golf managed properties', 'Municipal course')"
  }
]

Rules:
- Use REAL data from actual web search results — do not make up emails or URLs
- If you can't find an email, set booking_email to null — do NOT guess
- Website URLs must be the course's actual official website
- Prefer emails like: proshop@, info@, golf@, events@, bookings@
- If the course has a parent management company (Troon, ClubCorp, etc.), note that`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        tools: [{ type: "web_search_20250305", name: "web_search" }],
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `API error: ${response.status}`, details: errorText },
        { status: 502 }
      );
    }

    const data = await response.json();

    const textContent = data.content
      .filter((block: any) => block.type === "text")
      .map((block: any) => block.text)
      .join("\n");

    const clean = textContent.replace(/```json|```/g, "").trim();

    let results: any[];
    try {
      results = JSON.parse(clean);
    } catch {
      const arrayMatch = clean.match(/\[[\s\S]*\]/);
      if (arrayMatch) {
        results = JSON.parse(arrayMatch[0]);
      } else {
        return NextResponse.json({
          error: "Could not parse research results",
          raw: textContent.slice(0, 500),
        }, { status: 500 });
      }
    }

    // Update each course with the research results
    let updated = 0;
    let emailsFound = 0;

    for (const result of results) {
      // Find the matching course
      const course = courses.find(
        (c: any) => c.course_name === result.course_name
      );

      if (!course) continue;

      const updateData: any = {};
      if (result.website_url) updateData.website_url = result.website_url;
      if (result.booking_email) {
        updateData.booking_email = result.booking_email;
        emailsFound++;
      }
      if (result.clubhouse_phone) updateData.clubhouse_phone = result.clubhouse_phone;
      if (result.marketing_contact_name) updateData.marketing_contact_name = result.marketing_contact_name;
      if (result.notes) updateData.notes = result.notes;
      updateData.updated_at = new Date().toISOString();

      if (Object.keys(updateData).length > 1) {
        const { error: updateError } = await supabase
          .from("marketing_partnerships")
          .update(updateData)
          .eq("id", course.id);

        if (!updateError) updated++;
      }
    }

    return NextResponse.json({
      success: true,
      researched: courses.length,
      updated,
      emailsFound,
      results,
    });
  } catch (error) {
    console.error("[course-research] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Research failed" },
      { status: 500 }
    );
  }
}
