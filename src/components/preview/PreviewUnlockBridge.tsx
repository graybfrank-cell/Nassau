import type { Destination } from "@/lib/destination-utils";

export default function PreviewUnlockBridge({ dest }: { dest: Destination }) {
  const v3 = dest.recommended_itinerary;
  const hasV3 = Array.isArray(v3) && v3.length > 0;
  const totalEntries = hasV3 ? v3!.length : 0;
  const lockedCount = Math.max(0, totalEntries - 2);

  if (lockedCount === 0) return null;

  return (
    <section className="bg-[#F2F0EB] px-6 py-12 lg:px-16">
      <div className="mx-auto max-w-3xl text-center border-t border-[#111111]/10 pt-12">
        <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-[#2D5A3D]">
          {lockedCount} more {lockedCount === 1 ? "day" : "days"} inside
        </p>
        <p className="mt-4 max-w-xl mx-auto text-[16px] leading-relaxed text-[#5A5A5A]">
          The full day-by-day — including which course to play when the wind picks up,
          caddie strategy, and the right tee times to book — is in the kit.
        </p>
        <div className="mt-8">
          <button
            type="button"
            className="inline-block cursor-not-allowed rounded-full bg-[#2D5A3D] px-8 py-3.5 text-sm font-medium text-white opacity-90 transition-colors hover:bg-[#244B33]"
            aria-disabled="true"
          >
            Unlock the rest for $29 &rarr;
          </button>
        </div>
      </div>
    </section>
  );
}
