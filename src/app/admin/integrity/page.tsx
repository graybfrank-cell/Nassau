"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type {
  IntegrityReport,
  ProbeResult,
  RunStatus,
  StoredIntegrityCheck,
} from "@/lib/integrity/types";

/* ── Status visual map ─────────────────────────────────────── */
const STATUS_STYLE: Record<
  RunStatus,
  { dot: string; bg: string; border: string; label: string }
> = {
  GREEN: {
    dot: "bg-emerald-400",
    bg: "bg-emerald-950/40",
    border: "border-emerald-700/40",
    label: "GREEN — All systems healthy",
  },
  YELLOW: {
    dot: "bg-yellow-400",
    bg: "bg-yellow-950/40",
    border: "border-yellow-700/40",
    label: "YELLOW — Non-critical issues detected",
  },
  RED: {
    dot: "bg-red-500",
    bg: "bg-red-950/40",
    border: "border-red-700/40",
    label: "RED — Critical failures",
  },
};

const PROBE_STATUS_STYLE: Record<string, { text: string; bg: string }> = {
  PASS: { text: "text-emerald-300", bg: "bg-emerald-900/30" },
  FAIL: { text: "text-red-300", bg: "bg-red-900/30" },
  ERROR: { text: "text-orange-300", bg: "bg-orange-900/30" },
  SKIP: { text: "text-zinc-400", bg: "bg-zinc-800/50" },
};

const SEVERITY_STYLE: Record<string, string> = {
  CRITICAL: "text-red-400 bg-red-900/40 border-red-700/30",
  HIGH: "text-orange-400 bg-orange-900/40 border-orange-700/30",
  MEDIUM: "text-yellow-400 bg-yellow-900/40 border-yellow-700/30",
  LOW: "text-zinc-400 bg-zinc-800/50 border-zinc-700/30",
};

/* ── Component ─────────────────────────────────────────────── */
export default function IntegrityPage() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [report, setReport] = useState<IntegrityReport | null>(null);
  const [history, setHistory] = useState<StoredIntegrityCheck[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* ── Auth gate ── */
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setAuthed(user?.email === "graybfrank@gmail.com");
    });
  }, []);

  /* ── Fetch latest report via cron API ── */
  const runCheck = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/integrity-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trigger: "manual" }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const mapped: IntegrityReport = {
        runAt: new Date().toISOString(),
        trigger: "manual",
        status: data.status,
        totalChecks: data.totalChecks,
        passed: data.passed,
        failed: data.failed,
        errors: 0,
        criticals: data.criticals,
        durationMs: data.durationMs,
        results: data.results,
        summary: data.summary,
      };
      setReport(mapped);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Check failed");
    } finally {
      setLoading(false);
    }
  }, []);

  /* ── Fetch history from Supabase ── */
  const loadHistory = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from("integrity_checks")
        .select("*")
        .order("run_at", { ascending: false })
        .limit(10);
      if (data) setHistory(data as StoredIntegrityCheck[]);
    } catch {
      /* ignore — table may not exist yet */
    }
  }, []);

  /* ── Initial load + 60s auto-refresh ── */
  useEffect(() => {
    if (authed !== true) return;
    runCheck();
    loadHistory();
    const interval = setInterval(() => {
      runCheck();
      loadHistory();
    }, 60_000);
    return () => clearInterval(interval);
  }, [authed, runCheck, loadHistory]);

  /* ── Auth gate render ── */
  if (authed === null) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-zinc-400 animate-pulse">Authenticating...</div>
      </div>
    );
  }
  if (!authed) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-zinc-400 text-lg mb-4">Admin access required</p>
          <Link href="/login" className="text-[#2D5A3D] hover:underline">
            Sign in &rarr;
          </Link>
        </div>
      </div>
    );
  }

  const activeIssues = report?.results.filter(
    (r) => r.status === "FAIL" || r.status === "ERROR"
  ) ?? [];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* ── Header ── */}
      <header className="border-b border-zinc-800/60 bg-zinc-900/60 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/marketing"
              className="text-zinc-500 hover:text-zinc-300 transition-colors text-sm"
            >
              &larr; Admin
            </Link>
            <h1 className="text-xl font-semibold tracking-tight">
              Data Integrity
            </h1>
          </div>
          <button
            onClick={() => { runCheck(); loadHistory(); }}
            disabled={loading}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors bg-[#2D5A3D] hover:bg-[#244A32] disabled:opacity-50"
          >
            {loading ? "Running..." : "Run Checks"}
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* ── Error banner ── */}
        {error && (
          <div className="rounded-lg border border-red-800/50 bg-red-950/30 p-4 text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* ── Status banner ── */}
        {report && (
          <div
            className={`rounded-xl border p-6 flex items-center justify-between ${STATUS_STYLE[report.status].bg} ${STATUS_STYLE[report.status].border}`}
          >
            <div className="flex items-center gap-4">
              <span
                className={`w-4 h-4 rounded-full animate-pulse ${STATUS_STYLE[report.status].dot}`}
              />
              <div>
                <p className="text-lg font-semibold">
                  {STATUS_STYLE[report.status].label}
                </p>
                <p className="text-sm text-zinc-400 mt-0.5">
                  {report.summary}
                </p>
              </div>
            </div>
            <div className="text-right text-sm text-zinc-400">
              <p>{new Date(report.runAt).toLocaleString()}</p>
              <p>{report.durationMs}ms &middot; {report.totalChecks} checks</p>
            </div>
          </div>
        )}

        {/* ── Quick stats ── */}
        {report && (
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: "Total", value: report.totalChecks, color: "text-zinc-100" },
              { label: "Passed", value: report.passed, color: "text-emerald-400" },
              { label: "Failed", value: report.failed, color: "text-red-400" },
              { label: "Critical", value: report.criticals, color: "text-orange-400" },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-lg border border-zinc-800/60 bg-zinc-900/40 p-4 text-center"
              >
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-zinc-500 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* ── Active issues ── */}
        {activeIssues.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold mb-4 text-[#2D5A3D]">
              Active Issues
            </h2>
            <div className="space-y-3">
              {activeIssues.map((issue, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-zinc-800/60 bg-zinc-900/40 p-4"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded border ${SEVERITY_STYLE[issue.severity]}`}
                    >
                      {issue.severity}
                    </span>
                    <span className="font-medium">{issue.probe}</span>
                    <span className="text-xs text-zinc-500">{issue.category}</span>
                  </div>
                  <p className="text-sm text-zinc-300">{issue.detail}</p>
                  {issue.suggestedFix && (
                    <p className="text-sm text-zinc-500 mt-1">
                      Fix: {issue.suggestedFix}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── All probes ── */}
        {report && (
          <section>
            <h2 className="text-lg font-semibold mb-4">All Probes</h2>
            <div className="rounded-xl border border-zinc-800/60 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-zinc-900/60 text-zinc-400 text-left">
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Probe</th>
                    <th className="px-4 py-3 font-medium">Category</th>
                    <th className="px-4 py-3 font-medium">Severity</th>
                    <th className="px-4 py-3 font-medium">Detail</th>
                    <th className="px-4 py-3 font-medium text-right">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/40">
                  {report.results.map((r: ProbeResult, i: number) => {
                    const ps = PROBE_STATUS_STYLE[r.status] ?? PROBE_STATUS_STYLE.SKIP;
                    return (
                      <tr key={i} className="hover:bg-zinc-900/30">
                        <td className="px-4 py-3">
                          <span
                            className={`text-xs font-medium px-2 py-0.5 rounded ${ps.bg} ${ps.text}`}
                          >
                            {r.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-medium text-zinc-200">
                          {r.probe}
                        </td>
                        <td className="px-4 py-3 text-zinc-400">{r.category}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`text-xs px-2 py-0.5 rounded border ${SEVERITY_STYLE[r.severity] ?? ""}`}
                          >
                            {r.severity}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-zinc-400 max-w-xs truncate">
                          {r.detail}
                        </td>
                        <td className="px-4 py-3 text-right text-zinc-500">
                          {r.durationMs}ms
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* ── History ── */}
        {history.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold mb-4">Recent Runs</h2>
            <div className="space-y-2">
              {history.map((h) => (
                <div
                  key={h.id}
                  className="rounded-lg border border-zinc-800/60 bg-zinc-900/40 p-3 flex items-center justify-between text-sm"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${STATUS_STYLE[h.status]?.dot ?? "bg-zinc-600"}`}
                    />
                    <span className="text-zinc-300">
                      {new Date(h.run_at).toLocaleString()}
                    </span>
                    <span className="text-zinc-500">{h.trigger}</span>
                  </div>
                  <div className="flex items-center gap-4 text-zinc-400">
                    <span>{h.passed}/{h.total_checks} passed</span>
                    {h.criticals > 0 && (
                      <span className="text-red-400">{h.criticals} critical</span>
                    )}
                    {h.alert_sent && (
                      <span className="text-yellow-400 text-xs">alert sent</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Auto-refresh note ── */}
        <p className="text-xs text-zinc-600 text-center pt-4">
          Auto-refreshes every 60 seconds
        </p>
      </main>
    </div>
  );
}
