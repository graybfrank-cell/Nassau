import { NextRequest, NextResponse } from "next/server";
import { getUser, unauthorized } from "@/lib/auth";
import { runIntegrityCheck } from "@/lib/integrity/orchestrator";
import type { ProbeCategory, TriggerType } from "@/lib/integrity/types";

const ADMIN_EMAIL = "graybfrank@gmail.com";

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user || user.email !== ADMIN_EMAIL) return unauthorized();

  try {
    let trigger: TriggerType = "manual";
    let categories: ProbeCategory[] | undefined;
    try {
      const body = await req.json();
      trigger = body.trigger ?? "manual";
      categories = body.categories;
    } catch {
      /* no body is fine */
    }

    const report = await runIntegrityCheck(trigger, categories);
    return NextResponse.json({
      status: report.status,
      totalChecks: report.totalChecks,
      passed: report.passed,
      failed: report.failed,
      criticals: report.criticals,
      durationMs: report.durationMs,
      summary: report.summary,
      results: report.results,
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Integrity check failed", detail: (err as Error).message },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
export const maxDuration = 60;
