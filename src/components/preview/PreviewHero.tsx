import type { Destination } from "@/lib/destination-utils";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

function currentVerifiedDate(): string {
  const now = new Date();
  return `${MONTH_NAMES[now.getMonth()]} ${now.getFullYear()}`;
}

export default function PreviewHero({ dest }: { dest: Destination }) {
  // v3 fields with v1 fallbacks
  const title = dest.kit_title ?? dest.destination;
  const tagline = dest.kit_tagline ?? dest.why_go;
  const subtitle = dest.kit_subtitle ?? "Trip details inside";
  const verifiedDate = dest.verified_month ?? currentVerifiedDate();

  // Whether to show "destination" as small caps subtitle
  // (only if kit_title is different from destination string)
  const showDestinationSubtitle =
    dest.kit_title && dest.kit_title !== dest.destination;

  return (
    <section className="relative flex min-h-[80vh] flex-col items-center justify-center bg-[#111111] px-6 pt-24 pb-16 text-center">
      {/* Subtle gradient accent */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#2D5A3D]/15 via-transparent to-transparent" />

      <div className="relative z-10 mx-auto max-w-3xl">
        {/* Eyebrow */}
        <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-[#2D5A3D]">
          The Captain&apos;s Kit
        </p>

        {/* Kit title (main) */}
        <h1 className="mt-4 font-headline text-[48px] font-medium leading-[1.05] tracking-tight text-white sm:text-[64px]">
          {title}
        </h1>

        {/* Destination as small caps subtitle (only if kit_title differs) */}
        {showDestinationSubtitle && (
          <p className="mt-3 text-[12px] font-medium uppercase tracking-[0.15em] text-white/50">
            {dest.destination}
          </p>
        )}

        {/* Tagline / dek */}
        <p className="mx-auto mt-6 max-w-xl text-[18px] leading-relaxed text-white/70">
          {tagline}
        </p>

        {/* The pricing line */}
        <p className="mt-8 text-[14px] text-white/60">
          {subtitle}
        </p>

        {/* Buy CTA */}
        <div className="mt-10">
          <button
            type="button"
            className="inline-block cursor-not-allowed rounded-full bg-[#2D5A3D] px-8 py-3.5 text-sm font-medium text-white opacity-70 transition-colors hover:bg-[#244B33]"
            aria-disabled="true"
            title="Coming soon"
          >
            Buy this trip for $29 &rarr;
          </button>
          <p className="mt-3 text-[11px] uppercase tracking-[0.08em] text-white/30">
            Checkout opens at launch
          </p>
        </div>

        {/* Verified date stamp (anti-piracy defense) */}
        <p className="mt-12 text-[10px] uppercase tracking-[0.15em] text-white/30">
          Verified {verifiedDate}
        </p>
      </div>
    </section>
  );
}
