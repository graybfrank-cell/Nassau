import type { Destination } from "@/lib/destination-utils";

export default function PreviewCTA({ dest }: { dest: Destination }) {
  const title = dest.kit_title ?? dest.destination;
  const subtitle = dest.kit_subtitle ?? "The complete kit";

  return (
    <section className="bg-[#F2F0EB] px-6 py-24 text-center">
      <div className="mx-auto max-w-2xl">
        <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-[#2D5A3D]">
          The whole trip · one kit · $29
        </p>

        <h2 className="mt-4 font-headline text-[40px] font-medium leading-[1.05] text-[#111111] sm:text-[52px]">
          {title}
        </h2>

        <p className="mt-4 text-[16px] text-[#5A5A5A]">
          {subtitle}
        </p>

        <div className="mt-10">
          <button
            type="button"
            className="inline-block cursor-not-allowed rounded-full bg-[#2D5A3D] px-10 py-4 text-base font-medium text-white opacity-90 transition-colors hover:bg-[#244B33]"
            aria-disabled="true"
          >
            Buy this trip for $29 &rarr;
          </button>
          <p className="mt-4 text-[11px] uppercase tracking-[0.08em] text-[#8A8A8A]">
            Checkout opens at launch · one-time purchase · no subscription
          </p>
        </div>

        <p className="mt-12 text-[13px] italic text-[#8A8A8A]">
          You&apos;re the captain. Show up and run the trip.
        </p>
      </div>
    </section>
  );
}
