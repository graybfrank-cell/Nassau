import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";

const ADMIN_EMAIL = "graybfrank@gmail.com";

/**
 * Check if the current user is the marketing admin.
 * Returns the user if authorized, or a 403 NextResponse.
 */
export async function requireMarketingAdmin() {
  const user = await getUser();
  if (!user || user.email !== ADMIN_EMAIL) {
    return {
      authorized: false as const,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }
  return { authorized: true as const, user };
}
