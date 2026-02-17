import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const { searchParams, origin } = requestUrl;
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type");

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
      } else {
        return NextResponse.redirect(`${origin}/dashboard`);
      }
    } else if (token_hash && type) {
      // Magic link / OTP flow — verify the token hash
      const { error } = await supabase.auth.verifyOtp({
        token_hash,
        type: type as "email" | "magiclink",
      });
      if (error) {
        console.error("verifyOtp failed:", error.message);
      } else {
        return NextResponse.redirect(`${origin}/dashboard`);
      }
    } else {
      console.error(
        "Auth callback: no code or token_hash found. Search params:",
        Object.fromEntries(searchParams)
      );
    }
  } catch (err) {
    console.error("Auth callback exception:", err);
  }

  // If something went wrong, redirect to login
  return NextResponse.redirect(`${origin}/login`);
}
