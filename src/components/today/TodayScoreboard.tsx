"use client";

import type { TodayPayload } from "@/app/api/trips/[id]/today/route";

type Props = {
  scoreboard: TodayPayload["live_scoreboard"];
};

function formatToPar(toPar: number): string {
  if (toPar === 0) return "E";
  if (toPar > 0) return `+${toPar}`;
  return `${toPar}`;
}

export default function TodayScoreboard({ scoreboard }: Props) {
  const top = [...scoreboard]
    .sort((a, b) => {
      if (a.score_to_par !== b.score_to_par) return a.score_to_par - b.score_to_par;
      return b.thru_holes - a.thru_holes;
    })
    .slice(0, 8);

  return (
    <section className="bg-[#0A0A0A] px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <header className="mb-6 flex items-baseline justify-between">
          <h2 className="font-headline text-xl text-cream sm:text-2xl">Scoreboard</h2>
          <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-cream/45">
            Live
          </span>
        </header>

        {top.length === 0 ? (
          <p className="py-10 text-center text-[13px] text-cream/45">
            No rounds posted today yet
          </p>
        ) : (
          <ul className="divide-y divide-cream/[0.06]">
            {top.map((row, idx) => {
              const isLeader = idx === 0;
              return (
                <li
                  key={row.player_id}
                  className="flex items-center gap-4 py-3.5"
                >
                  <span
                    className={`w-6 shrink-0 font-mono text-[13px] ${
                      isLeader ? "text-[#C9A54E]" : "text-cream/55"
                    }`}
                  >
                    {row.position}
                  </span>
                  <span
                    className={`flex-1 truncate text-[15px] ${
                      isLeader ? "text-cream" : "text-cream/85"
                    }`}
                  >
                    {row.player_name}
                  </span>
                  <span
                    className={`font-mono text-[14px] tabular-nums ${
                      isLeader ? "text-[#C9A54E]" : "text-cream"
                    }`}
                  >
                    {formatToPar(row.score_to_par)}
                  </span>
                  <span className="w-16 shrink-0 text-right font-mono text-[11px] uppercase tracking-[0.18em] text-cream/45">
                    thru {row.thru_holes}
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
