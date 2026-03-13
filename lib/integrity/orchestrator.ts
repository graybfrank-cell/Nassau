import { createClient } from "@supabase/supabase-js";
import type { IntegrityReport, ProbeResult, RunStatus, TriggerType, ProbeCategory } from "./types";
import { authProbes } from "./probes/auth";
import { dataIntegrityProbes } from "./probes/dataIntegrity";
import { apiHealthProbes } from "./probes/apiHealth";
import { businessLogicProbes } from "./probes/businessLogic";
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const RESEND_API_KEY = process.env.RESEND_API_KEY!;
const ALERT_EMAIL = process.env.INTEGRITY_ALERT_EMAIL ?? "grayson@nassau.golf";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://nassau.golf";
const PROBE_MAP: Record<string, (() => Promise<ProbeResult>)[]> = {
  auth: authProbes,
  data_integrity: dataIntegrityProbes,
  api_health: apiHealthProbes,
  business_logic: businessLogicProbes,
  email: [],
  frontend: [],
};
function computeRunStatus(results: ProbeResult[]): RunStatus {
  if (results.some(r => r.status === "FAIL" && (r.severity === "CRITICAL" || r.severity === "HIGH"))) return "RED";
  if (results.some(r => r.status === "FAIL")) return "YELLOW";
  return "GREEN";
}
async function runCategory(category: string): Promise<ProbeResult[]> {
  const probes = PROBE_MAP[category] ?? [];
  if (probes.length === 0) return [];
  const results = await Promise.allSettled(probes.map(fn => fn()));
  return results.map((result, i): ProbeResult => {
    if (result.status === "fulfilled") return result.value;
    return { probe: probes[i].name, category: category as ProbeCategory, status: "ERROR", severity: "HIGH", detail: `Unhandled exception: ${result.reason?.message ?? String(result.reason)}`, durationMs: 0 };
  });
}
async function sendAlertEmail(report: IntegrityReport): Promise<boolean> {
  if (!RESEND_API_KEY) return false;
  const failures = report.results.filter(r => r.status !== "PASS" && r.status !== "SKIP");
  const subject = `${report.status === "RED" ? "🔴" : "🟡"} Nassau Integrity ${report.status}: ${report.failed} failure(s)`;
  const html = `<h2>Nassau System Integrity ${report.status}</h2><p>${report.summary}</p><ul>${failures.map(r => `<li><strong>[${r.severity}] ${r.probe}:</strong> ${r.detail}${r.suggestedFix ? ` — Fix: ${r.suggestedFix}` : ""}</li>`).join("")}</ul><p><a href="${APP_URL}/admin/integrity">View Dashboard →</a></p>`;
  try {
    const res = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" }, body: JSON.stringify({ from: "Nassau Integrity <noreply@nassau.golf>", to: [ALERT_EMAIL], subject, html }) });
    return res.ok;
  } catch { return false; }
}
async function storeReport(report: IntegrityReport, alertSent: boolean): Promise<void> {
  const { error } = await supabaseAdmin.from("integrity_checks").insert({ run_at: report.runAt, trigger: report.trigger, status: report.status, total_checks: report.totalChecks, passed: report.passed, failed: report.failed, criticals: report.criticals, report, alert_sent: alertSent });
  if (error) console.error("[IntegrityAgent] Failed to store report:", error.message);
}
export async function runIntegrityCheck(trigger: TriggerType = "cron", categories?: ProbeCategory[]): Promise<IntegrityReport> {
  const globalStart = Date.now();
  const runAt = new Date().toISOString();
  const categoriesToRun = categories ?? ["auth", "data_integrity", "api_health", "business_logic"];
  console.log(`[IntegrityAgent] Starting (trigger: ${trigger})`);
  const categoryResults = await Promise.all(categoriesToRun.map(cat => runCategory(cat)));
  const allResults = categoryResults.flat();
  const passed = allResults.filter(r => r.status === "PASS").length;
  const failed = allResults.filter(r => r.status === "FAIL" || r.status === "ERROR").length;
  const criticals = allResults.filter(r => r.status === "FAIL" && r.severity === "CRITICAL").length;
  const status = computeRunStatus(allResults);
  const summary = status === "GREEN" ? `All ${passed} checks passed.` : `${failed} issue(s) detected. ${criticals} critical.`;
  const report: IntegrityReport = { runAt, trigger, status, totalChecks: allResults.length, passed, failed, errors: 0, criticals, durationMs: Date.now() - globalStart, results: allResults, summary };
  let alertSent = false;
  if (status === "RED") alertSent = await sendAlertEmail(report);
  await storeReport(report, alertSent);
  console.log(`[IntegrityAgent] Done: ${status} · ${passed}/${allResults.length} passed · ${Date.now() - globalStart}ms`);
  return report;
}
