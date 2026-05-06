"use client";

import type { TodayPayload } from "@/app/api/trips/[id]/today/route";

type Props = {
  trip: TodayPayload["trip"];
};

function totalDays(start: string, end: string): number {
  if (!start || !end) return 0;
  const startUtc = new Date(`${start}T00:00:00Z`).getTime();
  const endUtc = new Date(`${end}T00:00:00Z`).getTime();
  if (isNaN(startUtc) || isNaN(endUtc)) return 0;
  return Math.max(1, Math.floor((endUtc - startUtc) / (1000 * 60 * 60 * 24)) + 1);
}

export default function TodayHero({ trip }: Props) {
  const total = totalDays(trip.start_date, trip.end_date);
  const day = trip.day_number > 0 ? trip.day_number : 1;

  return (
    <section className="relative overflow-hidden bg-[#0A0A0A] px-6 pb-10 pt-14 sm:pt-20">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#1A140A] via-[#0A0A0A] to-[#0A0A0A] opacity-90"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#C9A54E]/40 to-transparent"
      />

      <div className="relative mx-auto flex max-w-3xl flex-col gap-5">
        {trip.destination && (
          <p className="font-mono text-[11px] uppercase tracking-[0.32em] text-cream/55">
            {trip.destination}
          </p>
        )}

        <h1 className="font-headline text-[2.25rem] leading-[1.05] text-cream sm:text-[3rem]">
          {trip.name}
        </h1>

        <div className="flex items-baseline gap-3">
          <span className="font-mono text-[12px] uppercase tracking-[0.28em] text-[#C9A54E]">
            Day {day}
            {total > 0 ? ` of ${total}` : ""}
          </span>
        </div>

        <div className="mt-1 h-px w-16 bg-[#C9A54E]/70" />
      </div>
    </section>
  );
}
