import { NextResponse } from "next/server";
export async function GET() {
  return NextResponse.json({ status: "ok", app: "nassau", timestamp: new Date().toISOString() });
}
export const dynamic = "force-dynamic";
