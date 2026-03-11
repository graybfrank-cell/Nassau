import { NextRequest, NextResponse } from "next/server";
import { getUser, unauthorized } from "@/lib/auth";
import { fetchWeather } from "@/lib/weather";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await getUser();
  if (!user) return unauthorized();

  const { searchParams } = req.nextUrl;
  const lat = parseFloat(searchParams.get("lat") || "");
  const lng = parseFloat(searchParams.get("lng") || "");
  const date = searchParams.get("date") || "";

  if (isNaN(lat) || isNaN(lng) || !date) {
    return NextResponse.json(
      { error: "lat, lng, and date (YYYY-MM-DD) are required" },
      { status: 400 }
    );
  }

  const forecast = await fetchWeather(lat, lng, date);

  if (!forecast) {
    return NextResponse.json(
      { error: "Unable to fetch weather data" },
      { status: 502 }
    );
  }

  return NextResponse.json(forecast);
}
