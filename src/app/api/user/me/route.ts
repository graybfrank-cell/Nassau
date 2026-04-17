import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser, unauthorized } from "@/lib/auth";
import { apiError } from "@/lib/api-utils";

export async function GET() {
  try {
    const user = await getUser();
    if (!user) return unauthorized();

    const profile = await prisma.profiles.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        full_name: true,
        email: true,
        venmo_username: true,
        avatar_url: true,
      },
    });

    if (!profile) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: profile.id,
      fullName: profile.full_name,
      displayName: profile.full_name || profile.email?.split("@")[0] || "Golfer",
      email: profile.email,
      venmoUsername: profile.venmo_username,
      avatarUrl: profile.avatar_url,
    });
  } catch (err) {
    return apiError(err, "GET /api/user/me");
  }
}
