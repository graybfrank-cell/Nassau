import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/admin";

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function GET() {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createServiceClient();

    // Check for existing code
    const { data: existing } = await supabase
      .from("referral_codes")
      .select("code")
      .eq("user_id", user.id)
      .single();

    if (existing) {
      return NextResponse.json({
        code: existing.code,
        referral_url: `https://nassau.golf/r/${existing.code}`,
      });
    }

    // Generate new unique code
    let code = generateCode();
    let attempts = 0;
    while (attempts < 5) {
      const { data: conflict } = await supabase
        .from("referral_codes")
        .select("id")
        .eq("code", code)
        .single();

      if (!conflict) break;
      code = generateCode();
      attempts++;
    }

    const { error } = await supabase.from("referral_codes").insert({
      user_id: user.id,
      code,
    });

    if (error) {
      console.error("[referral/generate] Insert error:", error);
      return NextResponse.json({ error: "Failed to generate code" }, { status: 500 });
    }

    return NextResponse.json({
      code,
      referral_url: `https://nassau.golf/r/${code}`,
    });
  } catch (error) {
    console.error("[referral/generate] Error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
