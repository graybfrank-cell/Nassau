import type { Itinerary } from "@/lib/destination-utils";

function itemIcon(type: string) {
  switch (type) {
    case "tee_time":
      return "⛳";
    case "dinner":
    case "lunch":
      return "🍽";
    case "travel":
      return "✈";
    case "activity":
      return "🎯";
    default:
      return "·";
  }
}

export default function PreviewItinerary({
  itinerary,
  destinationName,
}: {
  itinerary: Itinerary;
  destinationName: string;
}) {
  return (
    <section className="bg-white px-6 py-16 lg:px-16">
      <div className="mx-auto max-w-4xl">
        <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#8A8A8A]">
          Sample itinerary
        </p>
        <h2 className="mt-3 font-headline text-[32px] font-medium leading-tight tracking-tight text-[#111111] sm:text-[36px]">
          {itinerary.duration_nights} nights in {destinationName}
        </h2>
        <p className="mt-2 text-sm text-[#8A8A8A]">
          {itinerary.ideal_group_size} players &middot; ~$
          {itinerary.estimated_cost_pp.toLocaleString()} per person
        </p>

        <div className="mt-10 space-y-8">
          {(itinerary?.days ?? []).map((day) => (
            <div key={day.day} className="relative">
              {/* Day header */}
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#2D5A3D] text-xs font-semibold text-white">
                  {day.day}
                </span>
                <h3 className="font-headline text-[18px] font-medium text-[#111111]">
                  {day.title}
                </h3>
              </div>

              {/* Timeline items */}
              <div className="ml-4 mt-4 space-y-3 border-l border-[#2D5A3D]/20 pl-7">
                {(day.items ?? []).map((item, i) => (
                  <div key={i} className="relative">
                    {/* Dot on the timeline */}
                    <div className="absolute -left-[33px] top-1 h-2 w-2 rounded-full bg-[#2D5A3D]/40" />
                    <div className="flex items-start gap-3">
                      <span className="w-16 shrink-0 text-xs text-[#8A8A8A]">
                        {item.time}
                      </span>
                      <span className="text-sm">
                        {itemIcon(item.type)}{" "}
                        <span className="text-[#111111]">{item.title}</span>
                        {item.cost_pp > 0 && (
                          <span className="ml-2 text-xs text-[#8A8A8A]">
                            ${item.cost_pp}/pp
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
