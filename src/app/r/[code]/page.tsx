import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createServiceClient } from "@/lib/supabase/admin";

interface Props {
  params: Promise<{ code: string }>;
}

export default async function ReferralRedirect({ params }: Props) {
  const { code } = await params;
  const supabase = createServiceClient();

  // Verify the referral code exists
  const { data: referralCode } = await supabase
    .from("referral_codes")
    .select("id, code")
    .eq("code", code)
    .single();

  if (referralCode) {
    // Increment click count via direct update
    await supabase
      .from("referral_codes")
      .update({ clicks: ((referralCode as { clicks?: number }).clicks ?? 0) + 1 })
      .eq("code", code);

    // Set referral cookie (30-day expiry)
    const cookieStore = await cookies();
    cookieStore.set("nassau_referral_code", code, {
      maxAge: 30 * 24 * 60 * 60,
      path: "/",
      httpOnly: true,
      secure: true,
      sameSite: "lax",
    });
  }

  redirect("/auth/signup");
}
