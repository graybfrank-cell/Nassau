"use client";

import Link from "next/link";
import { Crown, ChevronRight } from "lucide-react";
import { HeroBackdrop } from "@/components/HeroBackdrop";
import { DEMO_TRIP, DEMO_CREW, DEMO_ROUNDS, DEMO_ITINERARY } from "@/lib/demo-data";

const fmtRange = (s: string, e: string): string => {
  const a = new Date(s + "T12:00:00"), b = new Date(e + "T12:00:00");
  return `${a.toLocaleDateString("en-US", { month: "short" })} ${a.getDate()}–${b.getDate()}, ${a.getFullYear()}`;
};
const SCHEDULE_EMOJIS: Record<string, string> = {
  tee_time: "⛳", dinner: "🍽️", travel: "✈️", activity: "🎯",
};

// Group itinerary by date
const itineraryByDate = DEMO_ITINERARY.reduce<Record<string, typeof DEMO_ITINERARY>>((acc, item) => {
  (acc[item.date] ??= []).push(item);
  return acc;
}, {});

export default function DemoTripSharePage() {
  const nights = Math.round(
    (new Date(DEMO_TRIP.endDate + "T12:00:00").getTime() - new Date(DEMO_TRIP.startDate + "T12:00:00").getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="min-h-screen bg-[#F2F0EB] pb-12">
      {/* ── Hero ── */}
      <HeroBackdrop
        src="/heroes/bandon-dunes.png"
        alt="Bandon Dunes coastal links"
        height="lg"
        priority
      >
        <p className="text-xs uppercase tracking-widest text-white/70 mb-2">
          You&apos;re invited to
        </p>
        <h1 className="font-headline text-5xl md:text-6xl tracking-tight">
          Bandon Dunes 2026 — The Annual
        </h1>
        <p className="mt-3 text-white/80 flex gap-4 flex-wrap">
          <span>📍 Bandon, Oregon</span>
          <span>🗓 May 8–11, 2026</span>
          <span>👥 6 players</span>
        </p>
        <span className="mt-4 inline-block px-3 py-1 bg-white/15 backdrop-blur rounded-full text-xs">
          ⏱ 26 days away
        </span>
      </HeroBackdrop>

      <div className="mx-auto max-w-lg px-4 -mt-4">
        {/* ── Trip Info Card ── */}
        <div className="rounded-xl border border-[#E2D9CC] bg-white p-5 shadow-sm">
          <div className="grid grid-cols-3 divide-x divide-[#F2F0EB] text-center">
            <div>
              <p className="text-xl font-bold text-[#1A1A1A]">{nights + 1}</p>
              <p className="text-[10px] font-medium uppercase tracking-wider text-[#8A8078]">Days</p>
            </div>
            <div>
              <p className="text-xl font-bold text-[#1A1A1A]">{DEMO_ROUNDS.length}</p>
              <p className="text-[10px] font-medium uppercase tracking-wider text-[#8A8078]">Rounds</p>
            </div>
            <div>
              <p className="text-xl font-bold text-[#1A1A1A]">${DEMO_TRIP.costPerPerson.toLocaleString()}</p>
              <p className="text-[10px] font-medium uppercase tracking-wider text-[#8A8078]">Per Person</p>
            </div>
          </div>
        </div>

        {/* ── Crew ── */}
        <div className="mt-4 rounded-xl border border-[#E2D9CC] bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#8A8078]">Who&apos;s Going</p>
          <div className="mt-3 space-y-2">
            {DEMO_CREW.map((m) => (
              <div key={m.id} className="flex items-center justify-between py-1">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-[#2F4F4F] flex items-center justify-center text-[10px] font-medium text-white">
                    {m.name.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <div>
                    <span className="text-sm font-medium text-[#1A1A1A] flex items-center gap-1">
                      {m.role === "captain" && <Crown className="h-3 w-3 text-amber-600" />}
                      {m.name}
                    </span>
                    <p className="text-[11px] text-[#8A8078]">{m.nickname} · {m.handicap} HCP</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold uppercase text-[#2D5A3D] bg-[#2D5A3D]/10 px-2 py-0.5 rounded-full">Going</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Rounds ── */}
        <div className="mt-4 rounded-xl border border-[#E2D9CC] bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#8A8078]">Rounds</p>
          <div className="mt-3 space-y-2">
            {DEMO_ROUNDS.map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-lg bg-[#F2F0EB] px-3 py-2.5">
                <div>
                  <p className="text-sm font-semibold text-[#1A1A1A]">{r.courseName}</p>
                  <p className="text-xs text-[#8A8078]">{new Date(r.date + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} · Par {r.par}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-[#8A8078]" />
              </div>
            ))}
          </div>
        </div>

        {/* ── Itinerary ── */}
        <div className="mt-4 rounded-xl border border-[#E2D9CC] bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#8A8078]">Itinerary</p>
          {Object.entries(itineraryByDate).map(([date, items]) => (
            <div key={date} className="mt-3">
              <p className="text-xs font-bold text-[#1A1A1A]">
                {new Date(date + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
              </p>
              <div className="mt-1 space-y-1">
                {items.map((item, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-lg bg-[#F2F0EB] px-3 py-2">
                    <span>{SCHEDULE_EMOJIS[item.type] ?? "📌"}</span>
                    <div>
                      <p className="text-sm font-medium text-[#1A1A1A]">{item.title}</p>
                      <p className="text-xs text-[#8A8078]">{item.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* ── Lodging ── */}
        <div className="mt-4 rounded-xl border border-[#E2D9CC] bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#8A8078]">Lodging</p>
          <p className="mt-2 text-sm font-semibold text-[#1A1A1A]">{DEMO_TRIP.lodging}</p>
          <p className="text-xs text-[#8A8078]">{fmtRange(DEMO_TRIP.startDate, DEMO_TRIP.endDate)} · {nights} nights</p>
        </div>

        <button className="mt-6 w-full rounded-xl bg-[#2D5A3D] py-3.5 text-sm font-bold text-white active:scale-[0.98]">I&apos;m In — Commit to Trip</button>
        <p className="mt-4 text-center text-xs text-[#8A8078]">Share code: <span className="font-bold text-[#1A1A1A]">{DEMO_TRIP.shareCode}</span></p>
        <p className="mt-6 text-center text-xs text-[#8A8078]">Powered by <Link href="/" className="font-semibold text-[#1A1A1A]">Nassau</Link></p>
      </div>
    </div>
  );
}
