"use client";

import type { TodayPayload } from "@/app/api/trips/[id]/today/route";

type Props = {
  schedule: TodayPayload["today_schedule"];
};

function timeToMinutes(t: string): number {
  if (!t) return Number.MAX_SAFE_INTEGER;
  const [hh, mm] = t.split(":").map((s) => parseInt(s, 10));
  if (isNaN(hh)) return Number.MAX_SAFE_INTEGER;
  return hh * 60 + (isNaN(mm) ? 0 : mm);
}

function formatTime(t: string): string {
  if (!t) return "";
  const [hStr, mStr] = t.split(":");
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  if (isNaN(h)) return t;
  const period = h >= 12 ? "PM" : "AM";
  const display = h % 12 === 0 ? 12 : h % 12;
  const mm = isNaN(m) ? "00" : String(m).padStart(2, "0");
  return `${display}:${mm} ${period}`;
}

function nowMinutes(): number {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
}

function typeIcon(type: string): string {
  switch (type) {
    case "tee_time":
      return "⛳"; // golf flag
    case "dinner":
      return "🍽️"; // plate
    case "travel":
      return "✈️"; // plane
    case "lodging":
      return "🏨"; // hotel
    case "entertainment":
      return "🎉";
    case "activity":
      return "🎯";
    default:
      return "•";
  }
}

export default function TodaySchedule({ schedule }: Props) {
  const sorted = [...schedule]
    .sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time))
    .slice(0, 6);

  const currentMin = nowMinutes();

  return (
    <section className="bg-[#0A0A0A] px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <header className="mb-6">
          <h2 className="font-headline text-xl text-cream sm:text-2xl">Today</h2>
        </header>

        {sorted.length === 0 ? (
          <p className="py-10 text-center text-[13px] text-cream/45">
            No events scheduled for today
          </p>
        ) : (
          <ul className="space-y-1">
            {sorted.map((item) => {
              const itemMin = timeToMinutes(item.time);
              const isPast = itemMin < currentMin;
              return (
                <li
                  key={item.id}
                  className={`flex gap-4 rounded-lg px-3 py-3.5 transition ${
                    isPast ? "opacity-50" : ""
                  }`}
                >
                  <div className="w-20 shrink-0 font-mono text-[12px] uppercase tracking-[0.16em] text-cream/70">
                    {formatTime(item.time)}
                  </div>
                  <div
                    aria-hidden
                    className="mt-0.5 w-4 shrink-0 text-center text-[14px] leading-none"
                  >
                    {typeIcon(item.type)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] text-cream">{item.title}</p>
                    {item.description && (
                      <p className="mt-0.5 truncate text-[12px] text-cream/55">
                        {item.description}
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
