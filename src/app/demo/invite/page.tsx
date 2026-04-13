"use client";

import { useState } from "react";
import { Crown, Check, Clock, Copy, CheckCheck } from "lucide-react";
import { HeroBackdrop } from "@/components/HeroBackdrop";
import { DEMO_INVITE_STATUS } from "@/lib/demo-data";

const committed = DEMO_INVITE_STATUS.filter(
  (m) => m.status === "committed" || m.status === "captain"
).length;
const total = DEMO_INVITE_STATUS.length;

export default function DemoInvitePage() {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#F2F0EB] pb-16">
      {/* ── Hero ── */}
      <HeroBackdrop
        src="/heroes/bandon-dunes.png"
        alt="Bandon Dunes coastal links"
        height="md"
        priority
      >
        <p className="text-xs uppercase tracking-widest text-white/70 mb-2">
          Trip created — share with your crew
        </p>
        <h1 className="font-headline text-4xl md:text-5xl tracking-tight">
          Bandon Dunes 2026 — The Annual
        </h1>
      </HeroBackdrop>

      <div className="mx-auto max-w-lg px-4 -mt-4">
        {/* ── Share Link Card ── */}
        <div className="rounded-xl border border-[#E2D9CC] bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#8A8078]">
            Share link
          </p>
          <div className="mt-3 flex items-center gap-2">
            <div className="flex-1 rounded-lg bg-[#F2F0EB] px-4 py-3">
              <p className="text-sm font-medium text-[#1A1A1A] font-mono">
                nassau.golf/trip/BANDON26
              </p>
            </div>
            <button
              onClick={handleCopy}
              className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#2D5A3D] text-white active:scale-[0.95]"
            >
              {copied ? <CheckCheck className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
          {copied && (
            <p className="mt-2 text-xs text-[#2D5A3D] font-medium">Link copied!</p>
          )}
        </div>

        {/* ── Progress Bar ── */}
        <div className="mt-4 rounded-xl border border-[#E2D9CC] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#8A8078]">
              Crew status
            </p>
            <p className="text-xs font-bold text-[#2D5A3D]">
              {committed} of {total} committed
            </p>
          </div>
          <div className="h-2 rounded-full bg-[#F2F0EB] overflow-hidden">
            <div
              className="h-full rounded-full bg-[#2D5A3D] transition-all"
              style={{ width: `${(committed / total) * 100}%` }}
            />
          </div>
        </div>

        {/* ── Invitees List ── */}
        <div className="mt-4 rounded-xl border border-[#E2D9CC] bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#8A8078]">
            Invitees
          </p>
          <div className="mt-3 space-y-2">
            {DEMO_INVITE_STATUS.map((m) => (
              <div key={m.playerId} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-[#2F4F4F] flex items-center justify-center text-[10px] font-medium text-white">
                    {m.name.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <span className="text-sm font-medium text-[#1A1A1A]">{m.name}</span>
                </div>
                <StatusBadge status={m.status} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: "captain" | "committed" | "pending" }) {
  if (status === "captain") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-[#B8976A]/15 px-2.5 py-1 text-[10px] font-bold uppercase text-[#B8976A]">
        <Crown className="h-3 w-3" /> Captain
      </span>
    );
  }
  if (status === "committed") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-[#2D5A3D]/10 px-2.5 py-1 text-[10px] font-bold uppercase text-[#2D5A3D]">
        <Check className="h-3 w-3" /> Committed
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[#8A8A8A]/10 px-2.5 py-1 text-[10px] font-bold uppercase text-[#8A8A8A]">
      <Clock className="h-3 w-3" /> Pending
    </span>
  );
}
