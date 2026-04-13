"use client";

import Link from "next/link";
import { Trophy, Share2, DollarSign } from "lucide-react";
import { HeroBackdrop } from "@/components/HeroBackdrop";
import {
  DEMO_ROUNDS, DEMO_ROUND2_RESULTS, DEMO_SKINS, DEMO_NASSAU, DEMO_AWARDS, DEMO_SETTLEMENTS, getCrewName,
} from "@/lib/demo-data";

const round = DEMO_ROUNDS[1];
const coursePar = round.par;
const fmtPar = (t: number): string => { const d = t - coursePar; return d === 0 ? "E" : d > 0 ? `+${d}` : `${d}`; };
const leaderboard = DEMO_ROUND2_RESULTS.map((r) => ({
  ...r, name: getCrewName(r.playerId),
  moneyNet: (DEMO_SKINS.payouts[r.playerId] ?? 0) + (r.playerId === "p6" ? 40 : r.playerId === "p2" ? -10 : 0),
}));
const AWARD_EMOJIS: Record<string, string> = {
  "Low Round": "🏆", "Money Player": "💰", "Comeback Kid": "💪", "Steady Eddie": "⚖️",
};

export default function DemoRecapPage() {
  return (
    <div className="min-h-screen bg-[#F2F0EB] pb-12">
      {/* ── Hero ── */}
      <HeroBackdrop
        src="/heroes/bandon-dunes.png"
        alt="Pacific Dunes coastal cliffs"
        height="lg"
        priority
      >
        <span className="inline-block px-3 py-1 bg-black/50 backdrop-blur rounded-full text-xs uppercase tracking-wider mb-3">
          Final
        </span>
        <h1 className="font-serif text-5xl md:text-6xl tracking-tight">
          Pacific Dunes
        </h1>
        <p className="mt-3 text-white/80 flex gap-4">
          <span>📍 Bandon, Oregon</span>
          <span>🗓 Sunday, May 10, 2026</span>
        </p>
      </HeroBackdrop>

      <div className="mx-auto max-w-lg px-4">
        {/* ── Final Leaderboard ── */}
        <div className="mt-6 overflow-hidden rounded-xl border border-[#E2D9CC] bg-white">
          <div className="border-b border-[#E2D9CC] bg-[#1A1A1A] px-4 py-3">
            <p className="text-xs font-bold uppercase tracking-wider text-white/60">Final Leaderboard</p>
          </div>
          <div className="divide-y divide-[#F2F0EB]">
            {leaderboard.map((p, idx) => (
              <div key={p.playerId} className={`flex items-center justify-between px-4 py-3.5 ${idx === 0 ? "bg-amber-50" : ""}`}>
                <div className="flex items-center gap-3">
                  <span className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${idx === 0 ? "bg-[#2D5A3D] text-white" : "bg-[#F2F0EB] text-[#8A8078]"}`}>
                    {idx === 0 ? <Trophy className="h-4 w-4" /> : idx + 1}
                  </span>
                  <div>
                    <span className="text-sm font-semibold text-[#1A1A1A]">{p.name}</span>
                    {p.moneyNet !== 0 && (
                      <span className={`ml-2 text-xs font-medium ${p.moneyNet > 0 ? "text-emerald-600" : "text-red-500"}`}>
                        {p.moneyNet > 0 ? "+" : ""}${Math.abs(p.moneyNet)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xl font-bold text-[#1A1A1A]">{p.total}</span>
                  <p className="text-xs text-[#8A8078]">{fmtPar(p.total)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Skins ── */}
        <div className="mt-4 rounded-xl border border-[#E2D9CC] bg-white p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-[#8A8078] mb-3">Skins — ${DEMO_SKINS.buyIn} buy-in</p>
          <div className="border-t border-[#F2F0EB] pt-3 space-y-1.5">
            {Object.entries(DEMO_SKINS.payouts).filter(([, v]) => v !== 0).sort(([, a], [, b]) => b - a).map(([pid, amount]) => (
              <div key={pid} className="flex items-center justify-between">
                <span className="text-sm text-[#1A1A1A]">{getCrewName(pid)}</span>
                <span className={`text-sm font-bold ${amount > 0 ? "text-emerald-600" : "text-red-500"}`}>+${amount}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Nassau ── */}
        <div className="mt-4 rounded-xl border border-[#E2D9CC] bg-white p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-[#8A8078] mb-3">Nassau — ${DEMO_NASSAU.betAmount}/bet</p>
          <div className="space-y-2">
            {(["frontNine", "backNine", "overall"] as const).map((leg) => {
              const r = DEMO_NASSAU.round2[leg];
              const label = leg === "frontNine" ? "Front 9" : leg === "backNine" ? "Back 9" : "Overall";
              return (
                <div key={leg} className="flex items-center justify-between rounded-lg bg-[#F2F0EB] px-3 py-2">
                  <span className="text-xs font-semibold text-[#8A8078]">{label}</span>
                  <span className="text-sm font-bold text-[#1A1A1A]">{r.winnerId ? getCrewName(r.winnerId) : "Push"}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Awards ── */}
        <div className="mt-4 rounded-xl border border-[#E2D9CC] bg-white p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-[#8A8078] mb-3">Awards</p>
          <div className="space-y-2">
            {DEMO_AWARDS.map((a, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg bg-[#F2F0EB] px-3 py-2.5">
                <div>
                  <p className="text-xs font-bold text-[#2D5A3D]">{AWARD_EMOJIS[a.title] ?? "🏅"} {a.title}</p>
                  <p className="text-sm font-medium text-[#1A1A1A]">{a.playerName}</p>
                </div>
                <p className="text-xs text-[#8A8078] max-w-[140px] text-right">{a.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Settlements ── */}
        <div className="mt-4 rounded-xl border border-[#E2D9CC] bg-white p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-[#8A8078] mb-3">Settlements</p>
          <div className="space-y-2">
            {DEMO_SETTLEMENTS.map((s) => (
              <div key={s.id} className="flex items-center justify-between rounded-lg bg-[#F2F0EB] px-3 py-2.5">
                <span className="text-sm text-[#1A1A1A]">{getCrewName(s.fromId)} → {getCrewName(s.toId)}</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm text-[#1A1A1A]">${s.amount.toFixed(2)}</span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#2D5A3D] px-2.5 py-1 text-[10px] font-bold text-white">
                    <DollarSign className="h-2.5 w-2.5" />Venmo
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button className="flex-1 rounded-xl border border-[#E2D9CC] bg-white py-3.5 text-sm font-bold text-[#1A1A1A] inline-flex items-center justify-center gap-1"><Share2 className="h-4 w-4" />Share This Recap</button>
          <Link href="/demo" className="flex-1 rounded-xl bg-[#2D5A3D] py-3.5 text-center text-sm font-bold text-white">Back to Trip</Link>
        </div>
        <p className="mt-8 text-center text-xs text-[#8A8078]">Powered by <Link href="/" className="font-semibold text-[#1A1A1A]">Nassau</Link></p>
      </div>
    </div>
  );
}
