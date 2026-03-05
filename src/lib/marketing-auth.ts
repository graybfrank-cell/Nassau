import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const ADMIN_EMAIL = "graybfrank@gmail.com";

export async function requireMarketingAdmin() {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const { headers } = await import("next/headers");
    const headerStore = await headers();
    const authHeader = headerStore.get("authorization");
    if (authHeader === `Bearer ${cronSecret}`) {
      return { authorized: true as const, user: null };
    }
  }
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.email !== ADMIN_EMAIL) {
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
