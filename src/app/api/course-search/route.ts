import { NextRequest, NextResponse } from "next/server";

const API_KEY = process.env.GOLF_COURSE_API_KEY || "GTN32K6AKZQGYO2C7ZSIV66C7I";

// Try multiple base URLs in order — the correct one may change
const BASE_URLS = [
  "https://api.golfcourseapi.com/v1/search",
  "https://golfcourseapi.com/api/v1/search",
];

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q");
  if (!query || query.trim().length < 2) {
    return NextResponse.json({ courses: [] });
  }

  for (const baseUrl of BASE_URLS) {
    try {
      const url = `${baseUrl}?search_query=${encodeURIComponent(query.trim())}`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Key ${API_KEY}`,
        },
        signal: AbortSignal.timeout(5000),
      });

      if (res.ok) {
        const data = await res.json();
        // Normalize the response — the API may return courses in different shapes
        const courses = normalizeCourses(data);
        return NextResponse.json({ courses });
      }
    } catch {
      // Try next URL
      continue;
    }
  }

  // All URLs failed — return empty so the frontend shows the manual fallback
  return NextResponse.json({ courses: [], error: "Course search unavailable" });
}

interface RawCourse {
  id?: string | number;
  name?: string;
  club_name?: string;
  course_name?: string;
  city?: string;
  state?: string;
  country?: string;
  addr?: string;
  address?: string;
  holes?: number;
  lat?: number;
  lng?: number;
  latitude?: number;
  longitude?: number;
  coordinates?: { lat?: number; lng?: number };
  location?: { city?: string; state?: string; country?: string; lat?: number; lng?: number };
}

function normalizeCourses(data: unknown): Array<{
  id: string;
  name: string;
  location: string;
  holes: number | null;
  lat: number | null;
  lng: number | null;
}> {
  // Handle various response shapes
  const raw: RawCourse[] = Array.isArray(data)
    ? data
    : (data as Record<string, unknown>)?.courses
      ? ((data as Record<string, unknown>).courses as RawCourse[])
      : (data as Record<string, unknown>)?.results
        ? ((data as Record<string, unknown>).results as RawCourse[])
        : [];

  return raw.slice(0, 10).map((c, i) => ({
    id: String(c.id ?? i),
    name: c.name || c.club_name || c.course_name || "Unknown",
    location: formatLocation(c),
    holes: c.holes ?? null,
    lat: c.lat ?? c.latitude ?? c.coordinates?.lat ?? c.location?.lat ?? null,
    lng: c.lng ?? c.longitude ?? c.coordinates?.lng ?? c.location?.lng ?? null,
  }));
}

function formatLocation(c: RawCourse): string {
  const city = c.city || c.location?.city || "";
  const state = c.state || c.location?.state || "";
  const country = c.country || c.location?.country || "";
  return [city, state, country].filter(Boolean).join(", ");
}
