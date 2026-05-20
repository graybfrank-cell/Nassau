type Props = {
  tips: string[];
};

export default function PreviewInsiderTips({ tips }: Props) {
  if (!Array.isArray(tips) || tips.length === 0) return null;

  return (
    <section className="bg-[#F2F0EB] px-6 py-20 lg:px-16">
      <div className="mx-auto max-w-3xl">
        <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-[#2D5A3D]">
          From captains who&apos;ve been
        </p>
        <h2 className="mt-3 font-headline text-[36px] font-medium leading-tight tracking-tight text-[#111111] sm:text-[40px]">
          What the captains know
        </h2>
        <p className="mt-3 max-w-xl text-[14px] text-[#5A5A5A]">
          The small things that make or break the trip. Booking windows, weather codes, caddie strategy, the airport you should actually fly into.
        </p>

        {/* Blurred teaser tips. Cannot be selected/copied. */}
        <ul
          className="mt-10 space-y-4 select-none"
          aria-hidden="true"
          style={{
            // Prevent copy on most browsers
            WebkitUserSelect: "none",
            MozUserSelect: "none",
            msUserSelect: "none",
            userSelect: "none",
          }}
        >
          {tips.slice(0, 5).map((tip, i) => (
            <li
              key={i}
              className="flex items-start gap-4 rounded-lg border border-[#111111]/8 bg-white/40 p-5"
            >
              <span className="mt-0.5 inline-block min-w-[28px] text-[12px] font-medium uppercase tracking-[0.08em] text-[#2D5A3D]">
                {String(i + 1).padStart(2, "0")}
              </span>
              <p
                className="flex-1 text-[15px] leading-relaxed text-[#111111]"
                style={{
                  filter: "blur(6px)",
                  pointerEvents: "none",
                }}
              >
                {tip}
              </p>
            </li>
          ))}
        </ul>

        {/* The hook */}
        <div className="mt-12 text-center">
          <p className="text-[14px] text-[#5A5A5A]">
            {tips.length} insider tips · all unlocked when you buy the kit
          </p>
          <div className="mt-6">
            <button
              type="button"
              className="inline-block cursor-not-allowed rounded-full bg-[#2D5A3D] px-8 py-3.5 text-sm font-medium text-white opacity-90 transition-colors hover:bg-[#244B33]"
              aria-disabled="true"
            >
              Unlock the captain&apos;s playbook for $29 &rarr;
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
