import type {
  Destination,
  RecommendedItineraryEntry,
  Itinerary,
} from "@/lib/destination-utils";

const FREE_PREVIEW_ENTRY_COUNT = 2;

export default function PreviewItinerary({
  dest,
}: {
  dest: Destination;
}) {
  const v3 = dest.recommended_itinerary;
  const hasV3 = Array.isArray(v3) && v3.length > 0;

  const legacyItinerary: Itinerary | null = !hasV3
    ? Object.values(dest.sample_itineraries ?? {}).find(
        (it) => Array.isArray(it?.days) && it.days.length > 0,
      ) ?? null
    : null;

  if (!hasV3 && !legacyItinerary) return null;

  return (
    <section className="bg-[#F2F0EB] px-6 pt-10 pb-12 lg:px-16">
      <div className="mx-auto max-w-3xl">
        <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-[#2D5A3D]">
          The itinerary
        </p>
        <h2 className="mt-3 font-headline text-[36px] font-medium leading-tight tracking-tight text-[#111111] sm:text-[40px]">
          What you&apos;ll play and when
        </h2>
        <p className="mt-3 max-w-xl text-[14px] text-[#5A5A5A]">
          A captain wrote this. Every tee time has a reason. Here&apos;s the first part.
        </p>

        <div className="mt-10 space-y-8">
          {hasV3
            ? v3!.slice(0, FREE_PREVIEW_ENTRY_COUNT).map((entry, i) => (
                <V3Entry key={`${entry.day}-${entry.day_label}-${i}`} entry={entry} />
              ))
            : legacyItinerary?.days?.slice(0, FREE_PREVIEW_ENTRY_COUNT).map((day) => (
                <LegacyDay key={day.day} day={day} />
              ))}
        </div>
      </div>
    </section>
  );
}

function V3Entry({ entry }: { entry: RecommendedItineraryEntry }) {
  const isTravel = !entry.tee_time || /travel/i.test(entry.course_id);

  return (
    <div className="border-l border-[#2D5A3D]/40 pl-6">
      <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-[#2D5A3D]">
        {entry.day_label}
      </p>
      <h3 className="mt-2 font-headline text-[24px] font-medium leading-tight text-[#111111]">
        {entry.course_id}
      </h3>
      {entry.tee_time && !isTravel && (
        <p className="mt-1 text-[14px] text-[#5A5A5A]">
          Tee time: {entry.tee_time}
        </p>
      )}
      {entry.tee_time_logic && (
        <p className="mt-4 text-[15px] leading-relaxed italic text-[#3A3A3A]">
          {entry.tee_time_logic}
        </p>
      )}
    </div>
  );
}

function LegacyDay({ day }: { day: { day: number; title: string; items: { time: string; type: string; title: string; cost_pp: number }[] } }) {
  return (
    <div className="border-l border-[#2D5A3D]/40 pl-6">
      <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-[#2D5A3D]">
        Day {day.day}
      </p>
      <h3 className="mt-2 font-headline text-[24px] font-medium leading-tight text-[#111111]">
        {day.title}
      </h3>
      <ul className="mt-4 space-y-2">
        {day.items.slice(0, 2).map((item, i) => (
          <li key={i} className="text-[14px] text-[#5A5A5A]">
            <span className="font-medium text-[#111111]">{item.time}</span> · {item.title}
          </li>
        ))}
      </ul>
    </div>
  );
}
