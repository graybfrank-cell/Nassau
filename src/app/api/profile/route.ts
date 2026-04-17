import { NextRequest, NextResponse } from "next/server";
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
        email: true,
        full_name: true,
        avatar_url: true,
        venmo_username: true,
        subscription_status: true,
        subscription_tier: true,
      },
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    return NextResponse.json(profile);
  } catch (err) {
    return apiError(err, "GET /api/profile");
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getUser();
    if (!user) return unauthorized();

    const body = await req.json();

    const updates: Record<string, unknown> = {};

    if (typeof body.full_name === "string") {
      updates.full_name = body.full_name.trim();
    }

    if (typeof body.venmo_username === "string") {
      // Strip @ symbol if included, trim whitespace
      updates.venmo_username = body.venmo_username
        .trim()
        .replace(/^@/, "") || null;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    const profile = await prisma.profiles.update({
      where: { id: user.id },
      data: updates,
      select: {
        id: true,
        email: true,
        full_name: true,
        avatar_url: true,
        venmo_username: true,
        subscription_status: true,
        subscription_tier: true,
      },
    });

    return NextResponse.json(profile);
  } catch (err) {
    return apiError(err, "PATCH /api/profile");
  }
}
