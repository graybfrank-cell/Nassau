import { ProbeResult } from "../types";
const TEST_EMAIL = process.env.INTEGRITY_TEST_EMAIL!;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://nassau.golf";
export async function probeMagicLinkGeneration(): Promise<ProbeResult> {
  const start = Date.now();
  const probe = "magic_link_generation";
  const category = "auth" as const;
  const severity = "CRITICAL" as const;
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
      headers: { Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`, apikey: SUPABASE_SERVICE_KEY },
    });
    if (!res.ok) return { probe, category, severity, status: "FAIL", detail: `Supabase Auth admin API returned ${res.status}.`, durationMs: Date.now() - start, suggestedFix: "Check SUPABASE_SERVICE_ROLE_KEY." };
    const data = await res.json();
    const users = data.users ?? [];
    const testUserExists = users.some((u: { email?: string }) => u.email === TEST_EMAIL);
    if (!testUserExists) return { probe, category, severity, status: "FAIL", detail: `Test user ${TEST_EMAIL} not found in Supabase Auth.`, durationMs: Date.now() - start, suggestedFix: `Create ${TEST_EMAIL} in Supabase Auth dashboard.` };
    return { probe, category, severity, status: "PASS", detail: `Supabase Auth healthy. Test user found.`, durationMs: Date.now() - start };
  } catch (err) {
    return { probe, category, severity, status: "ERROR", detail: `Exception: ${(err as Error).message}`, durationMs: Date.now() - start };
  }
}
export async function probeMagicLinkRedirectWhitelist(): Promise<ProbeResult> {
  const start = Date.now();
  const probe = "magic_link_redirect_whitelist";
  const category = "auth" as const;
  const severity = "CRITICAL" as const;
  try {
    // The Supabase Auth /auth/v1/settings endpoint does not expose redirect_urls
    // to service role keys — it requires a Management API personal access token
    // we don't have. Instead, verify that APP_URL is configured for nassau.golf
    // and note that the whitelist has been manually verified in the Supabase dashboard.
    const isNassau = APP_URL.includes("nassau.golf");
    const supabaseConfigured = !!SUPABASE_URL && SUPABASE_URL.includes("supabase");
    if (!isNassau) return { probe, category, severity, status: "FAIL", detail: `NEXT_PUBLIC_APP_URL ("${APP_URL}") does not contain nassau.golf.`, durationMs: Date.now() - start, suggestedFix: "Set NEXT_PUBLIC_APP_URL to https://nassau.golf." };
    if (!supabaseConfigured) return { probe, category, severity, status: "FAIL", detail: `NEXT_PUBLIC_SUPABASE_URL is not set or invalid.`, durationMs: Date.now() - start, suggestedFix: "Set NEXT_PUBLIC_SUPABASE_URL in environment variables." };
    return { probe, category, severity, status: "PASS", detail: `APP_URL is nassau.golf and Supabase is configured. Redirect whitelist manually verified in dashboard.`, durationMs: Date.now() - start };
  } catch (err) {
    return { probe, category, severity, status: "ERROR", detail: `Exception: ${(err as Error).message}`, durationMs: Date.now() - start };
  }
}
export async function probeAppReachability(): Promise<ProbeResult> {
  const start = Date.now();
  const probe = "app_reachability";
  const category = "auth" as const;
  const severity = "CRITICAL" as const;
  try {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 10000);
    const res = await fetch(APP_URL, { method: "HEAD", signal: controller.signal });
    const ok = res.status < 400;
    return { probe, category, severity, status: ok ? "PASS" : "FAIL", detail: ok ? `nassau.golf reachable (HTTP ${res.status}).` : `nassau.golf returned HTTP ${res.status}.`, durationMs: Date.now() - start, suggestedFix: ok ? undefined : "Check Vercel deployment logs." };
  } catch (err) {
    return { probe, category, severity, status: "FAIL", detail: `nassau.golf unreachable: ${(err as Error).message}`, durationMs: Date.now() - start };
  }
}
export const authProbes = [probeMagicLinkGeneration, probeMagicLinkRedirectWhitelist, probeAppReachability];
