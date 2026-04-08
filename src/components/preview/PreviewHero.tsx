import type { Destination } from "@/lib/destination-utils";

function formatCostRange(costs: Destination["avg_cost_per_person_per_day"]) {
  return `$${costs.budget}–$${costs.premium}`;
}

function formatMonths(months: string[]) {
  if (months.length <= 3) return months.join(", ");
  return `${months[0]}–${months[months.length - 1]}`;
}

export default function PreviewHero({ dest }: { dest: Destination }) {
  const firstItinerary = Object.values(dest.sample_itineraries)[0];

  return (
    <section className="relative flex min-h-[70vh] flex-col items-center justify-center bg-[#111111] px-6 pt-24 pb-16 text-center">
      {/* Subtle gradient accent */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#2D5A3D]/15 via-transparent to-transparent" />

      <div className="relative z-10 mx-auto max-w-3xl">
        <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-[#2D5A3D]">
          Nassau Trip Preview
        </p>

        <h1 className="mt-4 font-headline text-[48px] font-medium leading-[1.05] tracking-tight text-white sm:text-[64px]">
          {dest.destination}
        </h1>

        <p className="mx-auto mt-6 max-w-xl text-[16px] leading-relaxed text-white/60">
          {dest.why_go}
        </p>

        {/* Quick stats row */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-sm sm:gap-10">
          <Stat label="Per person / day" value={formatCostRange(dest.avg_cost_per_person_per_day)} />
          <Stat label="Best months" value={formatMonths(dest.best_months)} />
          <Stat label="Group size" value={`${dest.group_size_sweet_spot} players`} />
          {firstItinerary && (
            <Stat
              label="Sample trip"
              value={`${firstItinerary.duration_nights}N · $${firstItinerary.estimated_cost_pp.toLocaleString()}/pp`}
            />
          )}
        </div>

        {/* Vibe tags */}
        <div className="mt-8 flex flex-wrap justify-center gap-2">
          {dest.vibe.map((v) => (
            <span
              key={v}
              className="rounded-full bg-white/8 px-3 py-1 text-xs text-white/50"
            >
              {v.replace(/-/g, " ")}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-white/40">
        {label}
      </p>
      <p className="mt-1 font-medium text-white">{value}</p>
    </div>
  );
}
