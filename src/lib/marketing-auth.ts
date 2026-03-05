import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getUser } from "@/lib/auth";

const ADMIN_EMAIL = "graybfrank@gmail.com";

/**
 * Check if the current user is the marketing admin.
 * Also allows Vercel cron requests (Authorization: Bearer $CRON_SECRET).
 * Returns the user if authorized, or a 403 NextResponse.
 */
export async function requireMarketingAdmin() {
  // Check for Vercel cron secret header first (cron jobs have no user session)
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const headerStore = await headers();
    const authHeader = headerStore.get("authorization");
    if (authHeader === `Bearer ${cronSecret}`) {
      return { authorized: true as const, user: null };
    }
  }

  // Standard user auth check
  try {
    const user = await getUser();
    if (!user || user.email !== ADMIN_EMAIL) {
      console.error(
        `[marketing-auth] Forbidden: user=${user?.email || "null"}, expected=${ADMIN_EMAIL}`
      );
      return {
        authorized: false as const,
        response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
      };
    }
    return { authorized: true as const, user };
  } catch (error) {
    console.error("[marketing-auth] Auth check failed:", error);
    return {
      authorized: false as const,
      response: NextResponse.json({ error: "Auth check failed" }, { status: 500 }),
    };
  }
}
