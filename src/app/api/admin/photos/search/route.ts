import { NextResponse } from "next/server";

// TODO: Replace with a local image browser that lists files from
// /public/images/destinations/ (and any future Nano Banana Pro output
// directories) so editors can pick hero photography without a third-party API.
export async function GET() {
  return NextResponse.json(
    {
      error: "Unsplash integration removed",
      message:
        "Photo search via Unsplash is no longer available. Hero photography is sourced from Nano Banana Pro and stored in /public/images/destinations/.",
    },
    { status: 410 }
  );
}
