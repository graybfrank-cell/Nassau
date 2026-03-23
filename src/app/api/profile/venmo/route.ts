import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser, unauthorized } from "@/lib/auth";

interface VenmoRequestBody {
  venmoUsername: string;
}

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return unauthorized();

  const body: unknown = await req.json();
  if (
    !body ||
    typeof body !== "object" ||
    !("venmoUsername" in body) ||
    typeof (body as VenmoRequestBody).venmoUsername !== "string"
  ) {
    return NextResponse.json(
      { error: "venmoUsername is required" },
      { status: 400 }
    );
  }

  const { venmoUsername } = body as VenmoRequestBody;

  // Strip @ prefix if included, trim whitespace
  const cleaned = venmoUsername.trim().replace(/^@/, "") || null;

  const profile = await prisma.profiles.update({
    where: { id: user.id },
    data: { venmo_username: cleaned },
    select: {
      id: true,
      venmo_username: true,
    },
  });

  return NextResponse.json({ success: true, venmoUsername: profile.venmo_username });
}
