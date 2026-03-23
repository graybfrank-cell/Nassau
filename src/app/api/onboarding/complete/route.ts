import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser, unauthorized } from "@/lib/auth";
import type { OnboardingRequest, OnboardingResponse } from "@/types/dashboard";

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return unauthorized();

  const body: unknown = await req.json();

  if (!body || typeof body !== "object") {
    return NextResponse.json<OnboardingResponse>(
      { success: false, error: "Invalid request body" },
      { status: 400 }
    );
  }

  const { fullName, venmoUsername, handicap } = body as OnboardingRequest;

  // Validate required fields
  if (typeof fullName !== "string" || fullName.trim().length === 0) {
    return NextResponse.json<OnboardingResponse>(
      { success: false, error: "Full name is required" },
      { status: 400 }
    );
  }

  if (typeof venmoUsername !== "string" || venmoUsername.trim().length === 0) {
    return NextResponse.json<OnboardingResponse>(
      { success: false, error: "Venmo username is required" },
      { status: 400 }
    );
  }

  // Clean venmo username — strip @ prefix
  const cleanedVenmo = venmoUsername.trim().replace(/^@/, "");

  const updateData: Record<string, unknown> = {
    full_name: fullName.trim(),
    venmo_username: cleanedVenmo,
    onboarding_complete: true,
  };

  // Handicap is optional
  if (handicap !== null && handicap !== undefined && typeof handicap === "number") {
    // Store handicap if we have a field for it; for now we skip since
    // the profiles table doesn't have a handicap column yet
  }

  await prisma.profiles.update({
    where: { id: user.id },
    data: updateData,
  });

  return NextResponse.json<OnboardingResponse>({ success: true });
}
