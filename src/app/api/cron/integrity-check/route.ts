import { NextRequest, NextResponse } from "next/server";
import { runIntegrityCheck } from "@/lib/integrity/orchestrator";
import type { ProbeCategory, TriggerType } from "@/lib/integrity/types";
export async function GET(req: NextRequest) { return handleRun(req, "cron"); }
export async function POST(req: NextRequest) { return handleRun(req, "manual"); }
async function handleRun(req: NextRequest, defaultTrigger: TriggerType) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = req.headers.get("authorization");
    const vercelHeader = req.headers.get("x-vercel-cron-secret");
    if (auth !== `Bearer ${cronSecret}` && vercelHeader !== cronSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }
  try {
    let trigger: TriggerType = defaultTrigger;
    let categories: ProbeCategory[] | undefined;
    if (req.method === "POST") {
      try { const body = await req.json(); trigger = body.trigger ?? defaultTrigger; categories = body.categories; } catch {}
    }
    const report = await runIntegrityCheck(trigger, categories);
    return NextResponse.json({ status: report.status, totalChecks: report.totalChecks, passed: report.passed, failed: report.failed, criticals: report.criticals, durationMs: report.durationMs, summary: report.summary, results: report.results });
  } catch (err) {
    return NextResponse.json({ error: "Integrity check failed", detail: (err as Error).message }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
export const maxDuration = 60;
