import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

  console.log(
    "Auth callback hit:",
    requestUrl.pathname + requestUrl.search
  );

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
      return NextResponse.redirect(`${baseUrl}/dashboard`);
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
      return NextResponse.redirect(`${baseUrl}/dashboard`);
    }

    console.error(
      "Auth callback: no code or token_hash found. Search params:",
      Object.fromEntries(searchParams)
    );
  } catch (err) {
    console.error("Auth callback exception:", err);
  }

  // If something went wrong, redirect to login with error
  return NextResponse.redirect(`${baseUrl}/login?error=auth_failed`);
}
