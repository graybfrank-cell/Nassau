import { NextRequest, NextResponse } from "next/server";
import { getUser, unauthorized } from "@/lib/auth";

const API_BASE = "https://api.golfcourseapi.com/v1";

export async function GET(req: NextRequest) {
  const user = await getUser();
  if (!user) return unauthorized();

  const query = req.nextUrl.searchParams.get("q") || "";
  if (query.length < 2) {
    return NextResponse.json([]);
  }

  const apiKey = process.env.GOLF_COURSE_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Golf course API key not configured" },
      { status: 500 }
    );
  }

  const res = await fetch(
    `${API_BASE}/search?search_query=${encodeURIComponent(query)}`,
    { headers: { Authorization: `Key ${apiKey}` } }
  );

  if (!res.ok) {
    return NextResponse.json(
      { error: "Course search failed" },
      { status: res.status }
    );
  }

  const data = await res.json();
  const courses = (data.courses || []).map(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (c: any) => ({
      id: String(c.id),
      name: c.club_name || c.name || "",
      city: c.city || "",
      state: c.state || "",
      country: c.country || "",
      par: c.par || 72,
      holes: c.holes || 18,
      location: [c.city, c.state, c.country].filter(Boolean).join(", "),
    })
  );
  return NextResponse.json(courses);
}

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return unauthorized();

  const { courseId } = await req.json();
  if (!courseId) {
    return NextResponse.json({ error: "courseId required" }, { status: 400 });
  }

  const apiKey = process.env.GOLF_COURSE_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Golf course API key not configured" },
      { status: 500 }
    );
  }

  const res = await fetch(`${API_BASE}/courses/${courseId}`, {
    headers: { Authorization: `Key ${apiKey}` },
  });

  if (!res.ok) {
    return NextResponse.json(
      { error: "Failed to fetch course details" },
      { status: res.status }
    );
  }

  const data = await res.json();
  const course = data.course || data;

  // Extract tee boxes
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const teeBoxes: any[] = course.tees?.eighteen || course.teeBoxes || course.tee_boxes || [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tees = teeBoxes.map((t: any) => {
    // Holes may be in t.holes or t.hole_data
    const holes = t.holes || t.hole_data || [];
    return {
      name: t.tee_name || t.name || "Unknown",
      gender: (t.gender || "male").toLowerCase(),
      rating: t.course_rating || t.rating || null,
      slope: t.slope || t.slope_rating || null,
      pars: holes.map((h: { par: number }) => h.par),
      yardages: holes.map((h: { yardage?: number; yards?: number; distance?: number }) =>
        h.yardage || h.yards || h.distance || 0
      ),
      handicaps: holes.map((h: { handicap?: number; hcp?: number }) =>
        h.handicap || h.hcp || 0
      ),
    };
  });

  return NextResponse.json({
    id: course.id,
    name: course.club_name || course.name || "",
    location: [course.city, course.state, course.country].filter(Boolean).join(", "),
    tees,
  });
}
