import { ProbeResult } from "../types";
import { createClient } from "@supabase/supabase-js";
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const GOLF_COURSE_API_KEY = process.env.GOLF_COURSE_API_KEY!;
const GOOGLE_MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY!;
const RESEND_API_KEY = process.env.RESEND_API_KEY!;
export async function probeGolfCourseAPI(): Promise<ProbeResult> {
  const start = Date.now();
  const probe = "golf_course_api";
  const category = "api_health" as const;
  const severity = "HIGH" as const;
  try {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 8000);
    const res = await fetch(`https://api.golfcourseapi.com/v1/search?search_query=Pebble+Beach`, { headers: { Authorization: `Key ${GOLF_COURSE_API_KEY}` }, signal: controller.signal });
    if (!res.ok) return { probe, category, severity, status: "FAIL", detail: `GolfCourseAPI returned HTTP ${res.status}.`, durationMs: Date.now() - start, suggestedFix: res.status === 401 ? "Regenerate GOLF_COURSE_API_KEY." : "Check golfcourseapi.com status." };
    const data = await res.json();
    const found = (data?.courses ?? []).some((c: { club_name?: string }) => c.club_name?.toLowerCase().includes("pebble"));
    return { probe, category, severity, status: found ? "PASS" : "FAIL", detail: found ? `GolfCourseAPI healthy. Pebble Beach found.` : `GolfCourseAPI up but Pebble Beach not in results.`, durationMs: Date.now() - start };
  } catch (err) {
    return { probe, category, severity, status: "FAIL", detail: `GolfCourseAPI failed: ${(err as Error).message}`, durationMs: Date.now() - start };
  }
}
export async function probeOpenMeteo(): Promise<ProbeResult> {
  const start = Date.now();
  const probe = "open_meteo_api";
  const category = "api_health" as const;
  const severity = "MEDIUM" as const;
  try {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 8000);
    const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=30.2672&longitude=-97.7431&daily=temperature_2m_max&timezone=America%2FChicago&forecast_days=3`, { signal: controller.signal });
    if (!res.ok) return { probe, category, severity, status: "FAIL", detail: `Open-Meteo returned HTTP ${res.status}.`, durationMs: Date.now() - start };
    const data = await res.json();
    const ok = Array.isArray(data?.daily?.temperature_2m_max) && data.daily.temperature_2m_max.length >= 3;
    return { probe, category, severity, status: ok ? "PASS" : "FAIL", detail: ok ? `Open-Meteo healthy. ${data.daily.temperature_2m_max.length} days returned.` : "Open-Meteo missing forecast data.", durationMs: Date.now() - start };
  } catch (err) {
    return { probe, category, severity, status: "FAIL", detail: `Open-Meteo failed: ${(err as Error).message}`, durationMs: Date.now() - start };
  }
}
export async function probeResendAPIKey(): Promise<ProbeResult> {
  const start = Date.now();
  const probe = "resend_api_key";
  const category = "api_health" as const;
  const severity = "CRITICAL" as const;
  if (!RESEND_API_KEY) return { probe, category, severity, status: "FAIL", detail: "RESEND_API_KEY not set.", durationMs: Date.now() - start };
  try {
    const res = await fetch("https://api.resend.com/domains", { headers: { Authorization: `Bearer ${RESEND_API_KEY}` } });
    if (res.status === 401) return { probe, category, severity, status: "FAIL", detail: "Resend API key invalid (401). All emails will fail.", durationMs: Date.now() - start, suggestedFix: "Generate a new key at resend.com/api-keys." };
    if (!res.ok) return { probe, category, severity, status: "FAIL", detail: `Resend API returned HTTP ${res.status}.`, durationMs: Date.now() - start };
    const data = await res.json();
    const domains: Array<{ name: string; status: string }> = data?.data ?? [];
    const nassauDomain = domains.find(d => d.name?.includes("nassau"));
    const verified = nassauDomain?.status === "verified";
    return { probe, category, severity, status: verified ? "PASS" : "FAIL", detail: verified ? `Resend healthy. nassau.golf domain verified.` : `Resend key valid but nassau.golf not verified (status: ${nassauDomain?.status ?? "not found"}).`, durationMs: Date.now() - start, suggestedFix: verified ? undefined : "Verify domain in Resend dashboard. Check SPF/DKIM in Namecheap DNS." };
  } catch (err) {
    return { probe, category, severity, status: "ERROR", detail: `Exception: ${(err as Error).message}`, durationMs: Date.now() - start };
  }
}
export async function probeSupabaseStorage(): Promise<ProbeResult> {
  const start = Date.now();
  const probe = "supabase_storage";
  const category = "api_health" as const;
  const severity = "MEDIUM" as const;
  try {
    const { data: buckets, error } = await supabaseAdmin.storage.listBuckets();
    if (error) return { probe, category, severity, status: "FAIL", detail: `Cannot list storage buckets: ${error.message}`, durationMs: Date.now() - start };
    const photosBucket = buckets?.find(b => b.name === "trip-photos" || b.name === "photos");
    return { probe, category, severity, status: photosBucket ? "PASS" : "FAIL", detail: photosBucket ? `Storage healthy. Found "${photosBucket.name}" bucket.` : `Storage accessible but "trip-photos" bucket not found. Found: ${buckets?.map(b => b.name).join(", ") || "none"}`, durationMs: Date.now() - start, suggestedFix: photosBucket ? undefined : 'Create a "trip-photos" bucket in Supabase Storage.' };
  } catch (err) {
    return { probe, category, severity, status: "ERROR", detail: `Exception: ${(err as Error).message}`, durationMs: Date.now() - start };
  }
}
export const apiHealthProbes = [probeGolfCourseAPI, probeOpenMeteo, probeResendAPIKey, probeSupabaseStorage];
