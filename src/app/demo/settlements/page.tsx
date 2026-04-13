"use client";

import Link from "next/link";
import Image from "next/image";
import { DollarSign, Home, Trophy, Map, User, ExternalLink } from "lucide-react";
import { DEMO_SETTLEMENTS, DEMO_SETTLEMENTS_TOTAL, getCrewName } from "@/lib/demo-data";

const FILTERS = ["All", "Pending", "Paid"] as const;

export default function DemoSettlementsPage() {
  // In demo mode all settlements are pending — total is split into "you owe" / "owed to you"
  // from Grayson's perspective (captain, id p1)
  const youOwe = DEMO_SETTLEMENTS.filter((s) => s.fromId === "p1")
    .reduce((sum, s) => sum + s.amount, 0);
  const owedToYou = DEMO_SETTLEMENTS.filter((s) => s.toId === "p1")
    .reduce((sum, s) => sum + s.amount, 0);

  return (
    <div className="min-h-screen bg-[#111111] pb-32">
      {/* ── BANNER ── */}
      <div className="relative h-40 sm:h-48 overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?q=80&w=2070&auto=format&fit=crop"
          alt="Golf course clubhouse" fill className="object-cover" priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#111111]/80 via-[#111111]/60 to-[#111111]" />
        <div className="relative z-10 flex flex-col h-full">
          <div className="flex items-center justify-between px-5 py-3">
            <Link href="/demo"><span className="font-headline text-[20px] font-medium tracking-[0.02em] text-[#F2F0EB]">Nassau</span></Link>
            <div className="h-8 w-8 rounded-full bg-[#2F4F4F] flex items-center justify-center text-[11px] font-medium text-[#F2F0EB]">GF</div>
          </div>
          <div className="mt-auto px-6 pb-5">
            <h1 className="text-[22px] font-headline font-medium text-[#F2F0EB] tracking-tight">Settlements</h1>
            <p className="text-[13px] text-[#F2F0EB]/50">Who owes who. Settle up fast.</p>
          </div>
        </div>
      </div>

      {/* ── SUMMARY CARD ── */}
      <div className="bg-[#1A1A1A] rounded-[10px] shadow-sm p-4 mx-6 mt-4">
        <div className="grid grid-cols-2">
          <div>
            <p className="font-sans text-[11px] font-medium uppercase tracking-[0.08em] text-[#5C5C5C]">You Owe</p>
            <p className="font-semibold text-2xl text-[#C4423B]">${youOwe.toFixed(2)}</p>
          </div>
          <div>
            <p className="font-sans text-[11px] font-medium uppercase tracking-[0.08em] text-[#5C5C5C]">Owed to You</p>
            <p className="font-semibold text-2xl text-[#2D5A3D]">${owedToYou.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* ── FILTER PILLS ── */}
      <div className="px-6 mt-4 flex gap-2">
        {FILTERS.map((f) => (
          <span key={f} className={`text-xs font-medium uppercase px-4 py-2 rounded-full whitespace-nowrap ${f === "All" ? "bg-[#2D5A3D] text-white" : "border border-[#2A2A2A] text-[#8A8A8A]"}`}>
            {f}
          </span>
        ))}
      </div>

      {/* ── SETTLEMENTS LIST ── */}
      <div className="px-6 mt-4 space-y-3">
        {DEMO_SETTLEMENTS.map((s) => {
          const isOwed = s.toId === "p1";
          return (
            <div key={s.id} className="bg-[#1A1A1A] rounded-[10px] shadow-sm p-4">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#F2F0EB]">
                  {isOwed ? getCrewName(s.fromId) : getCrewName(s.toId)}
                </span>
                <span className={`text-xl font-semibold ${isOwed ? "text-[#2D5A3D]" : "text-[#C4423B]"}`}>
                  {isOwed ? "+" : "-"}${s.amount.toFixed(2)}
                </span>
              </div>
              <p className="text-[12px] text-[#F2F0EB]/40 mt-1">{s.note}</p>
              <div className="mt-3 flex items-center gap-2">
                <button className="bg-[#C4423B] text-[#F2F0EB] rounded-[10px] py-2.5 px-4 text-[13px] font-medium inline-flex items-center gap-1.5">
                  <ExternalLink className="h-3.5 w-3.5" />Settle Up via Venmo
                </button>
                <button className="border border-[#F2F0EB]/10 text-[#F2F0EB]/50 rounded-[10px] py-2.5 px-4 text-[13px] font-medium">
                  Mark as Paid
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── TOTAL ── */}
      <div className="mx-6 mt-4 rounded-[10px] bg-[#1A1A1A] p-4 shadow-sm text-center">
        <p className="font-sans text-[11px] font-medium uppercase tracking-[0.08em] text-[#5C5C5C]">Total Outstanding</p>
        <p className="text-2xl font-bold text-[#F2F0EB] mt-1">${DEMO_SETTLEMENTS_TOTAL}</p>
        <p className="text-xs text-[#8A8A8A] mt-1">across {DEMO_SETTLEMENTS.length} transactions</p>
      </div>

      {/* ── BOTTOM NAV ── */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#111111] border-t border-[#1A1A1A] px-6 py-3">
        <div className="grid grid-cols-4">
          <Link href="/demo" className="flex flex-col items-center gap-1"><Home className="h-5 w-5 text-[#8A8A8A]" /><span className="text-xs uppercase font-bold text-[#8A8A8A]">Home</span></Link>
          <Link href="/demo/scorecard" className="flex flex-col items-center gap-1"><Trophy className="h-5 w-5 text-[#8A8A8A]" /><span className="text-xs uppercase font-bold text-[#8A8A8A]">Rounds</span></Link>
          <Link href="/demo/trip-share" className="flex flex-col items-center gap-1"><Map className="h-5 w-5 text-[#8A8A8A]" /><span className="text-xs uppercase font-bold text-[#8A8A8A]">Trips</span></Link>
          <Link href="/demo/settlements" className="flex flex-col items-center gap-1"><User className="h-5 w-5 text-[#2D5A3D]" /><span className="text-xs uppercase font-bold text-[#2D5A3D]">Profile</span></Link>
        </div>
      </nav>
    </div>
  );
}
