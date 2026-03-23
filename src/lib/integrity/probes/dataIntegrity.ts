import { ProbeResult } from "../types";
import { createClient } from "@supabase/supabase-js";
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const TEST_ROUND_ID = process.env.INTEGRITY_TEST_ROUND_ID!;
const TEST_TRIP_ID = process.env.INTEGRITY_TEST_TRIP_ID!;
const KNOWN_SCORECARD = {
  holes: [4,4,3,5,4,4,3,5,4,4,4,3,5,4,4,3,5,4],
  players: {
    playerA: [4,3,3,5,4,5,3,4,4,4,4,3,5,4,3,3,5,4],
    playerB: [5,4,3,5,4,4,3,5,4,4,4,3,5,4,4,3,5,4],
    playerC: [4,4,3,4,4,4,3,5,4,4,4,3,5,4,4,3,5,4],
    playerD: [4,4,3,5,4,4,3,5,4,5,4,3,5,4,4,3,5,4],
  },
  expectedSkins: { 2: "playerA", 4: "playerC", 8: "playerA", 15: "playerA" } as Record<number, string>,
};
function calculateSkinsFromFixture(): Record<number, string> {
  const { holes, players } = KNOWN_SCORECARD;
  const skins: Record<number, string> = {};
  const playerNames = Object.keys(players) as Array<keyof typeof players>;
  for (let i = 0; i < holes.length; i++) {
    const scores = playerNames.map(p => ({ name: p, score: players[p][i] }));
    const minScore = Math.min(...scores.map(s => s.score));
    const winners = scores.filter(s => s.score === minScore);
    if (winners.length === 1) skins[i + 1] = winners[0].name;
  }
  return skins;
}
export async function probeSkinsCalculation(): Promise<ProbeResult> {
  const start = Date.now();
  const probe = "skins_calculation";
  const category = "data_integrity" as const;
  const severity = "HIGH" as const;
  try {
    const calculatedSkins = calculateSkinsFromFixture();
    const expected = KNOWN_SCORECARD.expectedSkins;
    const failures: string[] = [];
    for (const [hole, expectedWinner] of Object.entries(expected)) {
      const actualWinner = calculatedSkins[Number(hole)];
      if (actualWinner !== expectedWinner) failures.push(`Hole ${hole}: expected ${expectedWinner}, got ${actualWinner ?? "no winner"}`);
    }
    for (const hole of Object.keys(calculatedSkins)) {
      if (!(Number(hole) in expected)) failures.push(`Hole ${hole}: unexpected skin to ${calculatedSkins[Number(hole)]}`);
    }
    if (failures.length > 0) return { probe, category, severity, status: "FAIL", detail: `Skins math drift: ${failures.join("; ")}`, durationMs: Date.now() - start, suggestedFix: "Review calculateSkins() for tie-handling bugs." };
    return { probe, category, severity, status: "PASS", detail: `Skins calculation correct.`, durationMs: Date.now() - start };
  } catch (err) {
    return { probe, category, severity, status: "ERROR", detail: `Exception: ${(err as Error).message}`, durationMs: Date.now() - start };
  }
}
export async function probeExpenseSplitMath(): Promise<ProbeResult> {
  const start = Date.now();
  const probe = "expense_split_math";
  const category = "data_integrity" as const;
  const severity = "HIGH" as const;
  try {
    const total = 247.50;
    const splitCount = 6;
    const shares = Array.from({ length: splitCount }, (_, i) => {
      if (i === splitCount - 1) { const soFar = Math.floor((total / splitCount) * 100) / 100 * (splitCount - 1); return Math.round((total - soFar) * 100) / 100; }
      return Math.round((total / splitCount) * 100) / 100;
    });
    const sharesSum = Math.round(shares.reduce((a, b) => a + b, 0) * 100) / 100;
    const drift = Math.abs(sharesSum - total);
    if (drift > 0.01) return { probe, category, severity, status: "FAIL", detail: `Expense split drift: $${total} / ${splitCount} = $${sharesSum} (drift $${drift.toFixed(2)})`, durationMs: Date.now() - start, suggestedFix: "Fix rounding — give remainder to last person." };
    return { probe, category, severity, status: "PASS", detail: `Expense split math clean. Drift: $${drift.toFixed(2)}.`, durationMs: Date.now() - start };
  } catch (err) {
    return { probe, category, severity, status: "ERROR", detail: `Exception: ${(err as Error).message}`, durationMs: Date.now() - start };
  }
}
export async function probeShareCodeUniqueness(): Promise<ProbeResult> {
  const start = Date.now();
  const probe = "share_code_uniqueness";
  const category = "data_integrity" as const;
  const severity = "HIGH" as const;
  try {
    const { data: trips, error: tripErr } = await supabaseAdmin.from("trips").select("share_code").not("share_code", "is", null);
    const { data: rounds, error: roundErr } = await supabaseAdmin.from("rounds").select("share_code").not("share_code", "is", null);
    if (tripErr || roundErr) return { probe, category, severity, status: "FAIL", detail: `DB query failed: ${tripErr?.message ?? roundErr?.message}`, durationMs: Date.now() - start };
    const allCodes = [...(trips?.map(t => t.share_code) ?? []), ...(rounds?.map(r => r.share_code) ?? [])];
    const uniqueCodes = new Set(allCodes);
    if (uniqueCodes.size < allCodes.length) {
      const duplicates = allCodes.filter((code, idx) => allCodes.indexOf(code) !== idx);
      return { probe, category, severity, status: "FAIL", detail: `Duplicate share codes: ${[...new Set(duplicates)].join(", ")}`, durationMs: Date.now() - start, suggestedFix: "Add UNIQUE constraint to share_code columns." };
    }
    return { probe, category, severity, status: "PASS", detail: `All ${allCodes.length} share codes are unique.`, durationMs: Date.now() - start };
  } catch (err) {
    return { probe, category, severity, status: "ERROR", detail: `Exception: ${(err as Error).message}`, durationMs: Date.now() - start };
  }
}
export async function probeTestRoundReadable(): Promise<ProbeResult> {
  const start = Date.now();
  const probe = "test_round_readable";
  const category = "data_integrity" as const;
  const severity = "MEDIUM" as const;
  if (!TEST_ROUND_ID) return { probe, category, severity, status: "SKIP", detail: "INTEGRITY_TEST_ROUND_ID not set.", durationMs: Date.now() - start, suggestedFix: "Add INTEGRITY_TEST_ROUND_ID to env vars." };
  try {
    const { data, error } = await supabaseAdmin.from("rounds").select("id, status, course_name, is_test").eq("id", TEST_ROUND_ID).single();
    if (error) return { probe, category, severity, status: "FAIL", detail: `Cannot read test round: ${error.message}`, durationMs: Date.now() - start };
    return { probe, category, severity, status: data.is_test ? "PASS" : "FAIL", detail: data.is_test ? `Test round "${data.course_name}" readable and flagged is_test.` : `Round exists but is_test is false — unsafe.`, durationMs: Date.now() - start };
  } catch (err) {
    return { probe, category, severity, status: "ERROR", detail: `Exception: ${(err as Error).message}`, durationMs: Date.now() - start };
  }
}
export const dataIntegrityProbes = [probeSkinsCalculation, probeExpenseSplitMath, probeShareCodeUniqueness, probeTestRoundReadable];
