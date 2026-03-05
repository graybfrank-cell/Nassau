import { NextResponse } from "next/server";
import { getUser, unauthorized } from "@/lib/auth";

export async function GET() {
  const user = await getUser();
  if (!user) return unauthorized();

  // Settings are derived from environment variables and config
  const settings = {
    anthropicKeyConfigured: !!process.env.ANTHROPIC_API_KEY,
    supabaseConfigured: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    serviceRoleConfigured: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    senderEmail: "grayson@nassau.golf",
    schedules: {
      scoutAgent: "Every 6 hours",
      strategistAgent: "Monday 6 AM CT",
      contentAgent: "Daily at 9am ET",
      newsletterAgent: "Weekly on Monday",
      partnershipsAgent: "On demand",
    },
  };

  return NextResponse.json({ settings });
}
