"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * Client component that catches Supabase auth tokens delivered via URL
 * hash fragments (#access_token=...) which the server/proxy can never see.
 * Mounted on the home page as a safety net for when Supabase ignores
 * emailRedirectTo and redirects to the Site URL instead of /auth/callback.
 */
export default function AuthRedirect() {
  const router = useRouter();

  useEffect(() => {
    const hash = window.location.hash;
    if (!hash || !hash.includes("access_token")) return;

    const params = new URLSearchParams(hash.substring(1));
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");

    if (!accessToken || !refreshToken) return;

    const supabase = createClient();
    supabase.auth
      .setSession({ access_token: accessToken, refresh_token: refreshToken })
      .then(({ error }) => {
        if (error) {
          console.error("Failed to set session from hash:", error.message);
          return;
        }
        // Clear the hash and go to dashboard
        window.location.replace("/dashboard");
      });
  }, [router]);

  return null;
}
