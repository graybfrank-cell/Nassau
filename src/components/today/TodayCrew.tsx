"use client";

import Image from "next/image";
import type { TodayPayload } from "@/app/api/trips/[id]/today/route";

type Props = {
  members: TodayPayload["members"];
  captain: TodayPayload["captain"];
};

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

const RSVP_ORDER: Record<string, number> = {
  going: 0,
  yes: 0,
  maybe: 1,
  declined: 2,
  no: 2,
};

function rsvpRank(status: string): number {
  return RSVP_ORDER[status?.toLowerCase()] ?? 3;
}

function rsvpLabel(status: string): string {
  const s = status?.toLowerCase();
  if (s === "going" || s === "yes") return "Going";
  if (s === "maybe") return "Maybe";
  if (s === "declined" || s === "no") return "Declined";
  return status || "—";
}

function rsvpClass(status: string): string {
  const s = status?.toLowerCase();
  if (s === "going" || s === "yes") {
    return "border-[#2D5A3D]/50 text-[#A8C8B0]";
  }
  if (s === "maybe") {
    return "border-cream/20 text-cream/60";
  }
  if (s === "declined" || s === "no") {
    return "border-cream/10 text-cream/35";
  }
  return "border-cream/10 text-cream/45";
}

export default function TodayCrew({ members, captain }: Props) {
  const sorted = [...members].sort((a, b) => {
    const aCap = captain && a.id === captain.id ? -1 : 0;
    const bCap = captain && b.id === captain.id ? -1 : 0;
    if (aCap !== bCap) return aCap - bCap;
    if (a.role === "captain" && b.role !== "captain") return -1;
    if (b.role === "captain" && a.role !== "captain") return 1;
    return rsvpRank(a.rsvp_status) - rsvpRank(b.rsvp_status);
  });

  return (
    <section className="bg-[#0A0A0A] px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <header className="mb-6">
          <h2 className="font-headline text-xl text-cream sm:text-2xl">Crew</h2>
        </header>

        {sorted.length === 0 ? (
          <p className="py-10 text-center text-[13px] text-cream/45">No crew yet</p>
        ) : (
          <ul className="divide-y divide-cream/[0.06]">
            {sorted.map((m) => {
              const isCaptain =
                m.role === "captain" || (captain ? m.id === captain.id : false);
              return (
                <li key={m.id} className="flex items-center gap-4 py-3.5">
                  <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-cream/[0.08]">
                    {m.avatar_url ? (
                      <Image
                        src={m.avatar_url}
                        alt={m.name}
                        fill
                        sizes="36px"
                        className="object-cover"
                      />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center font-mono text-[11px] text-cream/70">
                        {initials(m.name) || "—"}
                      </span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-[15px] text-cream">{m.name}</span>
                      {isCaptain && (
                        <span className="shrink-0 rounded-sm border border-[#C9A54E]/40 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.18em] text-[#C9A54E]">
                          Captain
                        </span>
                      )}
                    </div>
                    <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-cream/45">
                      HCP {Number.isFinite(m.handicap) ? m.handicap : "—"}
                    </span>
                  </div>

                  <span
                    className={`shrink-0 rounded-full border px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] ${rsvpClass(
                      m.rsvp_status
                    )}`}
                  >
                    {rsvpLabel(m.rsvp_status)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
