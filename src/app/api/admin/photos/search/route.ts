import { NextRequest, NextResponse } from "next/server";
import { requireMarketingAdmin } from "@/lib/marketing-auth";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireMarketingAdmin();
    if (!auth.authorized) return auth.response;

    const query = req.nextUrl.searchParams.get("query") || "golf course";
    const accessKey = process.env.UNSPLASH_ACCESS_KEY;

    if (!accessKey) {
      // Fallback: return source URLs for curated golf photos
      const fallbackPhotos = [
        "golf course aerial",
        "golf green sunset",
        "golf fairway morning",
        "golf club house",
        "golf cart path",
        "golf bunker sand",
      ].map((term, i) => ({
        id: `fallback-${i}`,
        url: `https://source.unsplash.com/1200x800/?${encodeURIComponent(term)}`,
        thumb: `https://source.unsplash.com/400x300/?${encodeURIComponent(term)}`,
        photographer: "Unsplash",
        photographerUrl: "https://unsplash.com",
        unsplashUrl: "https://unsplash.com",
      }));

      return NextResponse.json({ photos: fallbackPhotos, fallback: true });
    }

    const res = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=12&orientation=landscape&client_id=${accessKey}`,
      { next: { revalidate: 300 } }
    );

    if (!res.ok) {
      console.error("[photos/search] Unsplash API error:", res.status);
      return NextResponse.json({ error: "Unsplash API error" }, { status: 502 });
    }

    const data = await res.json();

    const photos = data.results.map(
      (photo: {
        id: string;
        urls: { regular: string; small: string };
        user: { name: string; links: { html: string } };
        links: { html: string };
        alt_description: string | null;
      }) => ({
        id: photo.id,
        url: photo.urls.regular,
        thumb: photo.urls.small,
        alt: photo.alt_description || query,
        photographer: photo.user.name,
        photographerUrl: photo.user.links.html,
        unsplashUrl: photo.links.html,
      })
    );

    return NextResponse.json({ photos });
  } catch (error) {
    console.error("[photos/search] Error:", error);
    return NextResponse.json({ error: "Photo search failed" }, { status: 500 });
  }
}
