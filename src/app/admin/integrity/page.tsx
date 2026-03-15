"use client";

import { useEffect, useState, useCallback } from "react";

interface ProbeResult {
  probe: string;
  category: string;
  status: "PASS" | "FAIL" | "SKIP" | "ERROR";
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  detail: string;
  durationMs: number;
  suggestedFix?: string;
}

interface IntegrityReport {
  runAt: string;
  trigger: string;
  status: "GREEN" | "YELLOW" | "RED";
  totalChecks: number;
  passed: number;
  failed: number;
  criticals: number;
  durationMs: number;
  results: ProbeResult[];
  summary: string;
}

interface StoredCheck {
  id: string;
  run_at: string;
  trigger: string;
  status: "GREEN" | "YELLOW" | "RED";
  total_checks: number;
  passed: number;
  failed: number;
  criticals: number;
  report: IntegrityReport;
  alert_sent: boolean;
}

const STATUS_COLORS: Record<string, string> = {
  GREEN: "bg-green-500",
  YELLOW: "bg-amber-500",
  RED: "bg-red-500",
};

const STATUS_BG: Record<string, string> = {
  GREEN: "bg-green-50 border-green-200",
  YELLOW: "bg-amber-50 border-amber-200",
  RED: "bg-red-50 border-red-200",
};

const PROBE_STATUS_STYLE: Record<string, string> = {
  PASS: "text-green-700 bg-green-50",
  FAIL: "text-red-700 bg-red-50",
  ERROR: "text-orange-700 bg-orange-50",
  SKIP: "text-zinc-500 bg-zinc-50",
};

const SEVERITY_STYLE: Record<string, string> = {
  CRITICAL: "text-red-800 bg-red-100",
  HIGH: "text-orange-800 bg-orange-100",
  MEDIUM: "text-amber-800 bg-amber-100",
  LOW: "text-zinc-600 bg-zinc-100",
};

export default function IntegrityDashboard() {
  const [history, setHistory] = useState<StoredCheck[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [liveReport, setLiveReport] = useState<IntegrityReport | null>(null);
  const [selectedCheck, setSelectedCheck] = useState<StoredCheck | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/integrity-history");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setHistory(data.checks ?? []);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  async function runManualCheck() {
    setRunning(true);
    setLiveReport(null);
    setError(null);
    try {
      const res = await fetch("/api/cron/integrity-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trigger: "manual" }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setLiveReport(data as IntegrityReport);
      await fetchHistory();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setRunning(false);
    }
  }

  const activeReport = selectedCheck?.report ?? liveReport;
  const latestCheck = history[0] ?? null;

  return (
    <div className="min-h-screen px-4 py-8" style={{ backgroundColor: "#F3EDE4" }}>
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#1A1A1A]">System Integrity</h1>
            <p className="mt-1 text-sm text-[#5A4F45]">
              Automated health checks for Nassau infrastructure
            </p>
          </div>
          <button
            onClick={runManualCheck}
            disabled={running}
            className="rounded-xl px-5 py-2.5 text-sm font-bold text-white transition-colors disabled:opacity-50"
            style={{ backgroundColor: "#D94F2B" }}
          >
            {running ? "Running..." : "Run Check"}
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Latest status banner */}
        {latestCheck && !loading && (
          <div
            className={`mb-6 rounded-xl border p-4 ${STATUS_BG[latestCheck.status]}`}
          >
            <div className="flex items-center gap-3">
              <div className={`h-3 w-3 rounded-full ${STATUS_COLORS[latestCheck.status]}`} />
              <span className="font-semibold text-[#1A1A1A]">
                {latestCheck.status}
              </span>
              <span className="text-sm text-[#5A4F45]">
                {latestCheck.passed}/{latestCheck.total_checks} passed
                {latestCheck.criticals > 0 && ` · ${latestCheck.criticals} critical`}
                {latestCheck.failed > 0 && ` · ${latestCheck.failed} failed`}
              </span>
              <span className="ml-auto text-xs text-[#8A8078]">
                {new Date(latestCheck.run_at).toLocaleString()} · {latestCheck.trigger}
              </span>
            </div>
          </div>
        )}

        {loading && (
          <div className="py-20 text-center text-sm text-[#8A8078]">Loading...</div>
        )}

        {/* Probe results detail */}
        {activeReport && (
          <div className="mb-8">
            <h2 className="mb-3 text-lg font-semibold text-[#1A1A1A]">
              {selectedCheck ? "Selected Run" : "Latest Run"} — {activeReport.results.length} probes
              <span className="ml-2 text-xs font-normal text-[#8A8078]">
                {activeReport.durationMs}ms
              </span>
            </h2>
            <div className="space-y-2">
              {activeReport.results.map((r) => (
                <div
                  key={r.probe}
                  className="rounded-xl border border-[#E2D9CC] bg-[#FDFAF5] p-4"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`rounded-md px-2 py-0.5 text-xs font-bold ${PROBE_STATUS_STYLE[r.status]}`}
                    >
                      {r.status}
                    </span>
                    <span
                      className={`rounded-md px-2 py-0.5 text-xs font-medium ${SEVERITY_STYLE[r.severity]}`}
                    >
                      {r.severity}
                    </span>
                    <span className="font-mono text-sm font-medium text-[#1A1A1A]">
                      {r.probe}
                    </span>
                    <span className="ml-auto text-xs text-[#8A8078]">
                      {r.category} · {r.durationMs}ms
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-[#5A4F45]">{r.detail}</p>
                  {r.suggestedFix && (
                    <p className="mt-1 text-xs text-[#8A8078]">
                      Fix: {r.suggestedFix}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* History table */}
        {!loading && history.length > 0 && (
          <div>
            <h2 className="mb-3 text-lg font-semibold text-[#1A1A1A]">History</h2>
            <div className="overflow-hidden rounded-xl border border-[#E2D9CC] bg-[#FDFAF5]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#E2D9CC] text-left text-xs font-semibold text-[#5A4F45]">
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">When</th>
                    <th className="px-4 py-3">Trigger</th>
                    <th className="px-4 py-3">Passed</th>
                    <th className="px-4 py-3">Failed</th>
                    <th className="px-4 py-3">Alert</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((check) => (
                    <tr
                      key={check.id}
                      onClick={() => setSelectedCheck(selectedCheck?.id === check.id ? null : check)}
                      className={`cursor-pointer border-b border-[#E2D9CC] transition-colors hover:bg-[#F3EDE4]/50 ${selectedCheck?.id === check.id ? "bg-[#F3EDE4]" : ""}`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className={`h-2.5 w-2.5 rounded-full ${STATUS_COLORS[check.status]}`} />
                          <span className="font-medium">{check.status}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[#5A4F45]">
                        {new Date(check.run_at).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-[#5A4F45]">{check.trigger}</td>
                      <td className="px-4 py-3 text-green-700">{check.passed}</td>
                      <td className="px-4 py-3 text-red-700">{check.failed || "—"}</td>
                      <td className="px-4 py-3 text-[#5A4F45]">
                        {check.alert_sent ? "Sent" : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!loading && history.length === 0 && !activeReport && (
          <div className="py-20 text-center text-sm text-[#8A8078]">
            No integrity checks recorded yet. Click &quot;Run Check&quot; to start.
          </div>
        )}
      </div>
    </div>
  );
}
