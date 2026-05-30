import Image from "next/image";
import { getHeroImage, type Destination } from "@/lib/destination-utils";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

function currentVerifiedDate(): string {
  const now = new Date();
  return `${MONTH_NAMES[now.getMonth()]} ${now.getFullYear()}`;
}

export default function PreviewHero({ dest }: { dest: Destination }) {
  const title = dest.kit_title ?? dest.destination;
  const tagline = dest.kit_tagline ?? dest.why_go;
  const subtitle = dest.kit_subtitle ?? "Trip details inside";
  const verifiedDate = dest.verified_month ?? currentVerifiedDate();
  const heroImage = getHeroImage(dest);

  const showDestinationSubtitle =
    dest.kit_title && dest.kit_title !== dest.destination;

  return (
    <section className="relative flex min-h-[90vh] flex-col items-center justify-center overflow-hidden px-6 pt-24 pb-20 text-center">
      {/* Hero background image — full-bleed regional photo */}
      <Image
        src={heroImage}
        alt=""
        fill
        priority
        sizes="100vw"
        className="absolute inset-0 z-0 object-cover"
        aria-hidden="true"
      />

      {/* Dark overlay for even darkening across the whole image */}
      <div className="absolute inset-0 z-10 bg-black/30" aria-hidden="true" />

      {/* Bottom-up gradient for extra text legibility at the bottom */}
      <div
        className="absolute inset-0 z-10 bg-gradient-to-t from-black via-black/60 to-transparent"
        aria-hidden="true"
      />

      {/* Content (above the overlay layers) */}
      <div className="relative z-20 mx-auto max-w-3xl">
        {/* Eyebrow */}
        <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-[#2D5A3D] drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
          The Captain&apos;s Kit
        </p>

        {/* Kit title */}
        <h1 className="mt-4 font-headline text-[48px] font-medium leading-[1.05] tracking-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)] sm:text-[64px]">
          {title}
        </h1>

        {/* Destination subtitle (only if kit_title differs) */}
        {showDestinationSubtitle && (
          <p className="mt-3 text-[12px] font-medium uppercase tracking-[0.15em] text-white/70 drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
            {dest.destination}
          </p>
        )}

        {/* Tagline */}
        <p className="mx-auto mt-6 max-w-xl text-[18px] leading-relaxed text-white/85 drop-shadow-[0_1px_4px_rgba(0,0,0,0.5)]">
          {tagline}
        </p>

        {/* Pricing line */}
        <p className="mt-8 text-[14px] text-white/75 drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
          {subtitle}
        </p>

        {/* Manifest — 3 main + subtle italic line */}
        <ul className="mx-auto mt-10 max-w-md space-y-3 text-left">
          <ManifestItem text="The full day-by-day, course by course" />
          <ManifestItem text="Lodging pick, line-item costs, booking contacts" />
          <ManifestItem text="The captain's playbook (insider tips, bonus plays, founder note)" />
        </ul>
        <p className="mx-auto mt-5 max-w-md pl-8 text-left text-[13px] italic text-white/55 drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
          Plus weather codes, caddie strategy, and the airport you should actually fly into.
        </p>

        {/* Buy CTA */}
        <div className="mt-12">
          <button
            type="button"
            className="inline-block cursor-not-allowed rounded-full bg-[#2D5A3D] px-12 py-5 text-base font-medium text-white opacity-90 shadow-lg shadow-black/40 transition-all duration-200 hover:scale-[1.02] hover:bg-[#244B33] hover:opacity-100"
            aria-disabled="true"
            title="Coming soon"
          >
            Buy this trip for $29 &rarr;
          </button>
          <p className="mt-4 text-[11px] uppercase tracking-[0.08em] text-white/50 drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
            Checkout opens at launch · one-time purchase · no subscription
          </p>
        </div>

        {/* Verified date stamp */}
        <p className="mt-12 text-[10px] uppercase tracking-[0.15em] text-white/40 drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
          Verified {verifiedDate}
        </p>
      </div>
    </section>
  );
}

function ManifestItem({ text }: { text: string }) {
  return (
    <li className="flex items-start gap-3">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        className="mt-1 h-4 w-4 shrink-0 text-[#2D5A3D] drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M16.704 5.29a1 1 0 010 1.42l-8 8a1 1 0 01-1.42 0l-4-4a1 1 0 011.42-1.42L8 12.586l7.296-7.296a1 1 0 011.408 0z"
          clipRule="evenodd"
        />
      </svg>
      <span className="text-[15px] leading-relaxed text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)]">
        {text}
      </span>
    </li>
  );
}
