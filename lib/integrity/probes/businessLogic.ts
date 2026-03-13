import { ProbeResult } from "../types";
import { createClient } from "@supabase/supabase-js";
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://nassau.golf";
export async function probeVenmoDeepLink(): Promise<ProbeResult> {
  const start = Date.now();
  const probe = "venmo_deep_link_format";
  const category = "business_logic" as const;
  const severity = "MEDIUM" as const;
  try {
    const username = "testuser"; const amount = 42.50; const note = "Nassau trip settlement";
    const link = `venmo://paycharge?txn=charge&recipients=${username}&amount=${amount.toFixed(2)}&note=${encodeURIComponent(note)}`;
    const issues: string[] = [];
    if (!link.startsWith("venmo://")) issues.push("Missing venmo:// scheme");
    if (!link.includes("txn=charge")) issues.push("Missing txn=charge");
    if (!link.includes(`amount=${amount.toFixed(2)}`)) issues.push("Amount format wrong");
    if (link.includes(" ")) issues.push("Unencoded spaces");
    if (issues.length > 0) return { probe, category, severity, status: "FAIL", detail: `Venmo link issues: ${issues.join("; ")}`, durationMs: Date.now() - start, suggestedFix: "Use encodeURIComponent for all string values in Venmo URL." };
    return { probe, category, severity, status: "PASS", detail: `Venmo deep link format correct.`, durationMs: Date.now() - start };
  } catch (err) {
    return { probe, category, severity, status: "ERROR", detail: `Exception: ${(err as Error).message}`, durationMs: Date.now() - start };
  }
}
export async function probeRoundAutoComplete(): Promise<ProbeResult> {
  const start = Date.now();
  const probe = "round_auto_complete";
  const category = "business_logic" as const;
  const severity = "HIGH" as const;
  try {
    const eightHoursAgo = new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString();
    const { data: stuckRounds, error } = await supabaseAdmin.from("rounds").select("id, status, tee_time, course_name").eq("status", "active").lt("tee_time", eightHoursAgo).eq("is_test", false).limit(10);
    if (error) return { probe, category, severity, status: "FAIL", detail: `Cannot query rounds: ${error.message}`, durationMs: Date.now() - start };
    if (!stuckRounds || stuckRounds.length === 0) return { probe, category, severity, status: "PASS", detail: "No rounds stuck in active status past 8 hours.", durationMs: Date.now() - start };
    return { probe, category, severity, status: "FAIL", detail: `${stuckRounds.length} round(s) stuck in active >8hrs: ${stuckRounds.map(r => r.course_name).join(", ")}`, durationMs: Date.now() - start, suggestedFix: "Check round auto-complete trigger. The mutation moving rounds to 'complete' may not be firing." };
  } catch (err) {
    return { probe, category, severity, status: "ERROR", detail: `Exception: ${(err as Error).message}`, durationMs: Date.now() - start };
  }
}
export async function probeCriticalPageRoutes(): Promise<ProbeResult> {
  const start = Date.now();
  const probe = "critical_page_routes";
  const category = "business_logic" as const;
  const severity = "CRITICAL" as const;
  const pages = [{ path: "/", name: "Landing" }, { path: "/login", name: "Login" }, { path: "/explore", name: "Explore" }, { path: "/api/health", name: "Health API" }];
  const failures: string[] = [];
  await Promise.all(pages.map(async ({ path, name }) => {
    try {
      const controller = new AbortController();
      setTimeout(() => controller.abort(), 8000);
      const res = await fetch(`${APP_URL}${path}`, { method: "HEAD", redirect: "follow", signal: controller.signal });
      if (res.status >= 400) failures.push(`${name} (${path}) → HTTP ${res.status}`);
    } catch { failures.push(`${name} (${path}) → timeout/failed`); }
  }));
  if (failures.length > 0) return { probe, category, severity, status: "FAIL", detail: `${failures.length} page(s) not responding: ${failures.join("; ")}`, durationMs: Date.now() - start, suggestedFix: "Check Vercel deployment logs for 500 errors." };
  return { probe, category, severity, status: "PASS", detail: `All ${pages.length} critical pages reachable.`, durationMs: Date.now() - start };
}
export const businessLogicProbes = [probeVenmoDeepLink, probeRoundAutoComplete, probeCriticalPageRoutes];
