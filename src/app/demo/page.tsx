"use client";

import Link from "next/link";
import {
  Flag, Home, Trophy, Map, User, ChevronRight, DollarSign, Crown,
} from "lucide-react";
import { HeroBackdrop } from "@/components/HeroBackdrop";
import {
  DEMO_TRIP, DEMO_CREW, DEMO_ROUNDS, DEMO_STANDINGS, DEMO_SETTLEMENTS_TOTAL,
} from "@/lib/demo-data";

export default function DemoTripDashboard() {
  const completedRounds = DEMO_ROUNDS.filter((r) => r.status === "completed").length;

  return (
    <div className="min-h-screen bg-[#111111] pb-32">
      {/* ── HERO BANNER ── */}
      <HeroBackdrop
        src="/heroes/hero-backdrop.png"
        alt="Coastal golf at sunset"
        height="lg"
        priority
      >
        <h1 className="font-serif text-4xl md:text-5xl tracking-tight">
          {DEMO_TRIP.name}
        </h1>
        <p className="mt-2 text-white/80 text-sm md:text-base flex gap-4">
          <span>📍 Bandon, Oregon</span>
          <span>🗓 May 8–11, 2026</span>
        </p>
      </HeroBackdrop>

      {/* ── ROUND PROGRESS ── */}
      <div className="mx-6 mt-4 rounded-[10px] bg-[#1A1A1A] p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <p className="font-sans text-[11px] font-medium uppercase tracking-[0.08em] text-[#5C5C5C]">ROUNDS</p>
          <span className="text-xs text-[#2D5A3D] font-semibold">{completedRounds} of {DEMO_ROUNDS.length} played</span>
        </div>
        <div className="space-y-2">
          {DEMO_ROUNDS.map((r) => (
            <div key={r.id} className="flex items-center justify-between py-2 border-b border-[#2A2A2A] last:border-0">
              <div>
                <p className="font-semibold text-[#F2F0EB] text-sm">{r.courseName}</p>
                <p className="text-xs text-[#8A8A8A]">{new Date(r.date + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} · Par {r.par}</p>
              </div>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${r.status === "completed" ? "bg-[#2D5A3D]/20 text-[#2D5A3D]" : "bg-[#2A2A2A] text-[#8A8A8A]"}`}>
                {r.status === "completed" ? "Final" : "Scheduled"}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── STANDINGS ── */}
      <div className="px-6 mt-6">
        <p className="font-sans text-[11px] font-medium uppercase tracking-[0.08em] text-[#5C5C5C] mb-3">STANDINGS</p>
        <div className="rounded-[10px] bg-[#1A1A1A] overflow-hidden shadow-sm">
          {DEMO_STANDINGS.map((p, idx) => (
            <div key={p.playerId} className={`flex items-center justify-between px-4 py-3 ${idx === 0 ? "bg-[#2D5A3D]/10" : ""} ${idx < DEMO_STANDINGS.length - 1 ? "border-b border-[#2A2A2A]" : ""}`}>
              <div className="flex items-center gap-3">
                <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${idx === 0 ? "bg-[#2D5A3D] text-white" : "bg-[#2A2A2A] text-[#8A8A8A]"}`}>
                  {idx === 0 ? <Trophy className="h-3.5 w-3.5" /> : idx + 1}
                </span>
                <div>
                  <span className="text-sm font-semibold text-[#F2F0EB]">{p.name}</span>
                  {p.moneyNet !== 0 && (
                    <span className={`ml-2 text-xs font-medium ${p.moneyNet > 0 ? "text-[#2D5A3D]" : "text-[#C4423B]"}`}>
                      {p.moneyNet > 0 ? "+" : ""}${Math.abs(p.moneyNet)}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <span className="text-lg font-bold text-[#F2F0EB]">{p.totalStrokes}</span>
                <p className="text-xs text-[#8A8A8A]">+{p.totalStrokes - p.totalPar}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── CREW ── */}
      <div className="px-6 mt-6">
        <p className="font-sans text-[11px] font-medium uppercase tracking-[0.08em] text-[#5C5C5C] mb-3">CREW — {DEMO_CREW.length} PLAYERS</p>
        <div className="flex flex-wrap gap-2">
          {DEMO_CREW.map((m) => (
            <span key={m.id} className="inline-flex items-center gap-1.5 rounded-full bg-[#1A1A1A] px-3 py-1.5 text-sm font-medium text-[#F2F0EB]">
              {m.role === "captain" && <Crown className="h-3 w-3 text-amber-500" />}
              {m.name}
              <span className="text-[#5C5C5C] text-xs">({m.handicap})</span>
            </span>
          ))}
        </div>
      </div>

      {/* ── SETTLEMENTS BANNER ── */}
      <Link href="/demo/settlements" className="mx-6 mt-6 flex items-center justify-between bg-[#1A1A1A] rounded-[10px] p-4 shadow-sm">
        <div className="flex items-center">
          <DollarSign className="text-[#C4423B] w-5 h-5" />
          <div className="ml-3">
            <span className="font-semibold text-[#F2F0EB] text-sm">${DEMO_SETTLEMENTS_TOTAL} outstanding</span>
            <p className="text-xs text-[#8A8A8A]">5 settlements pending</p>
          </div>
        </div>
        <ChevronRight className="text-[#8A8A8A] w-4 h-4" />
      </Link>

      {/* ── QUICK LINKS ── */}
      <div className="px-6 mt-6 grid grid-cols-2 gap-3">
        <Link href="/demo/scorecard" className="rounded-[10px] bg-[#1A1A1A] p-4 shadow-sm">
          <Flag className="h-5 w-5 text-[#2D5A3D] mb-2" />
          <p className="font-semibold text-sm text-[#F2F0EB]">Scorecard</p>
          <p className="text-xs text-[#8A8A8A]">Pacific Dunes Rd 2</p>
        </Link>
        <Link href="/demo/recap" className="rounded-[10px] bg-[#1A1A1A] p-4 shadow-sm">
          <Trophy className="h-5 w-5 text-[#2D5A3D] mb-2" />
          <p className="font-semibold text-sm text-[#F2F0EB]">Recap</p>
          <p className="text-xs text-[#8A8A8A]">Round 2 results</p>
        </Link>
      </div>

      {/* ── BOTTOM NAV ── */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#111111] border-t border-[#1A1A1A] px-6 py-3">
        <div className="grid grid-cols-4">
          <Link href="/demo" className="flex flex-col items-center gap-1"><Home className="h-5 w-5 text-[#2D5A3D]" /><span className="text-xs uppercase font-medium text-[#2D5A3D]">Home</span></Link>
          <Link href="/demo/scorecard" className="flex flex-col items-center gap-1"><Trophy className="h-5 w-5 text-[#8A8A8A]" /><span className="text-xs uppercase font-medium text-[#8A8A8A]">Rounds</span></Link>
          <Link href="/demo/trip-share" className="flex flex-col items-center gap-1"><Map className="h-5 w-5 text-[#8A8A8A]" /><span className="text-xs uppercase font-medium text-[#8A8A8A]">Trips</span></Link>
          <Link href="/demo/settlements" className="flex flex-col items-center gap-1"><User className="h-5 w-5 text-[#8A8A8A]" /><span className="text-xs uppercase font-medium text-[#8A8A8A]">Profile</span></Link>
        </div>
      </nav>
    </div>
  );
}
