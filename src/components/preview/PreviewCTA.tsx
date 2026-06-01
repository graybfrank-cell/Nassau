import type { Destination } from "@/lib/destination-utils";
import BuyKitButton from "./BuyKitButton";

export default function PreviewCTA({ dest }: { dest: Destination }) {
  const title = dest.kit_title ?? dest.destination;
  const subtitle = dest.kit_subtitle ?? "The complete kit";

  return (
    <section className="bg-[#111111] px-6 py-24 text-center">
      <div className="mx-auto max-w-2xl">
        <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-[#2D5A3D]">
          The whole trip · one kit · $29
        </p>

        <h2 className="mt-4 font-headline text-[40px] font-medium leading-[1.05] text-white sm:text-[52px]">
          {title}
        </h2>

        <p className="mt-4 text-[16px] text-white/70">
          {subtitle}
        </p>

        <div className="mt-10">
          <BuyKitButton dest={dest} variant="cta" />
          <p className="mt-4 text-[11px] uppercase tracking-[0.08em] text-white/40">
            One-time purchase · 7-day refund · no subscription
          </p>
        </div>

        <p className="mt-12 text-[13px] italic text-white/50">
          You&apos;re the captain. Show up and run the trip.
        </p>
      </div>
    </section>
  );
}
