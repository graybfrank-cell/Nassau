import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";

const ADMIN_EMAIL = "graybfrank@gmail.com";

// Credits a referral if the current user was referred by the code in the
// cookie. Only credits if no existing referral record exists for this user.
async function creditReferralFromCookie(): Promise<void> {
  try {
    const cookieStore = await cookies();
    const ref = cookieStore.get("nassau_referral_code")?.value;
    if (!ref) return;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const admin = createServiceClient();

    // Skip if this user has already been credited
    const { data: existing } = await admin
      .from("referrals")
      .select("id")
      .eq("referred_id", user.id)
      .maybeSingle();
    if (existing) return;

    const { data: referrer } = await admin
      .from("referral_codes")
      .select("user_id")
      .eq("code", ref)
      .single();
    if (!referrer || referrer.user_id === user.id) return;

    await admin.from("referrals").insert({
      referrer_id: referrer.user_id,
      referred_id: user.id,
      referral_code: ref,
    });

    // Clear cookie after credit
    cookieStore.delete("nassau_referral_code");
  } catch (err) {
    console.error("creditReferralFromCookie failed:", err);
  }
}

async function getPostLoginRedirect(baseUrl: string): Promise<string> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return `${baseUrl}/dashboard`;

    // Admin always goes to dashboard
    if (user.email === ADMIN_EMAIL) {
      return `${baseUrl}/dashboard`;
    }

    const admin = createServiceClient();
    const { data: profile } = await admin
      .from("profiles")
      .select("subscription_status, onboarding_complete")
      .eq("id", user.id)
      .single();

    // Check if onboarding is complete — gate all users behind this
    if (!profile?.onboarding_complete) {
      return `${baseUrl}/onboarding`;
    }

    const status = profile?.subscription_status;
    if (status === "active" || status === "trialing") {
      return `${baseUrl}/dashboard`;
    }
    return `${baseUrl}/pricing`;
  } catch {
    return `${baseUrl}/dashboard`;
  }
}

function getBaseUrl(request: Request): string {
  // On Vercel, request.url origin can be internal. Use x-forwarded-host
  // or the env var to build the correct public-facing URL.
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") || "https";

  if (forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`;
  }

  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }

  // Fallback to request origin (works in local dev)
  return new URL(request.url).origin;
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const { searchParams } = requestUrl;
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const baseUrl = getBaseUrl(request);

  console.log("Auth callback hit:", requestUrl.pathname);

  // Capture referral code from query param and persist it in a cookie so the
  // signup webhook (or post-auth handler) can credit it after session exchange.
  const ref = searchParams.get("ref");
  if (ref) {
    const cookieStore = await cookies();
    cookieStore.set("nassau_referral_code", ref, {
      maxAge: 30 * 24 * 60 * 60,
      path: "/",
      httpOnly: true,
      secure: true,
      sameSite: "lax",
    });
  }

  // Check for a `next` redirect param (e.g. /round/[shareCode], /admin/*)
  const next = searchParams.get("next");
  // Validate: only allow known paths to prevent open redirect
  const isValidNext =
    next &&
    (next.startsWith("/round/") ||
      next === "/rounds" ||
      next.startsWith("/rounds/") ||
      next.startsWith("/admin/") ||
      next.startsWith("/dashboard") ||
      next === "/trips" ||
      next.startsWith("/trips/") ||
      next.startsWith("/settlements"));

  try {
    const supabase = await createClient();

    if (code) {
      // PKCE flow — exchange authorization code for session
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        console.error("exchangeCodeForSession failed:", error.message);
        return NextResponse.redirect(
          `${baseUrl}/login?error=auth_failed&message=${encodeURIComponent(error.message)}`
        );
      }
      await creditReferralFromCookie();
      if (isValidNext) {
        return NextResponse.redirect(`${baseUrl}${next}`);
      }
      return NextResponse.redirect(await getPostLoginRedirect(baseUrl));
    }

    if (token_hash && type) {
      // Magic link / OTP flow — verify the token hash
      const { error } = await supabase.auth.verifyOtp({
        token_hash,
        type: type as "email" | "magiclink",
      });
      if (error) {
        console.error("verifyOtp failed:", error.message);
        return NextResponse.redirect(
          `${baseUrl}/login?error=auth_failed&message=${encodeURIComponent(error.message)}`
        );
      }
      await creditReferralFromCookie();
      if (isValidNext) {
        return NextResponse.redirect(`${baseUrl}${next}`);
      }
      return NextResponse.redirect(await getPostLoginRedirect(baseUrl));
    }

    console.error("Auth callback: no code or token_hash found");
  } catch (err) {
    console.error("Auth callback exception:", err);
  }

  // If something went wrong, redirect to login with error
  return NextResponse.redirect(`${baseUrl}/login?error=auth_failed`);
}
