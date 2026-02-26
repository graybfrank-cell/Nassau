// GET /api/places/autocomplete?input=scotts
// Server-side proxy to Google Places Autocomplete API.
// Uses GOOGLE_PLACES_API_KEY from env — never exposed to the client.

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const input = searchParams.get("input");

  if (!input || input.length < 2) {
    return Response.json({ predictions: [] });
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    return Response.json({ predictions: [] });
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&types=(cities)&key=${encodeURIComponent(apiKey)}`;

    const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
    const data = await res.json();

    return Response.json({ predictions: data.predictions ?? [] });
  } catch {
    // Network error or timeout — return empty so the client falls back to KB
    return Response.json({ predictions: [] });
  }
}
