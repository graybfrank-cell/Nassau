import type { Destination } from "@/lib/destination-utils";

type SectionDescriptor = {
  title: string;
  blurb: string;
  hasContent: (d: Destination) => boolean;
};

const SECTIONS: SectionDescriptor[] = [
  {
    title: "Where you'll stay and why",
    blurb: "The lodging pick, the rate, the reason it beats the alternatives.",
    hasContent: (d) => !!d.recommended_lodging?.name,
  },
  {
    title: "What it really costs (line by line)",
    blurb: "The actual number per person. Not a vague range.",
    hasContent: (d) => Array.isArray(d.cost_breakdown_4day) && d.cost_breakdown_4day.length > 0,
  },
  {
    title: "Who to call and what to ask",
    blurb: "Phone numbers, emails, the exact booking script.",
    hasContent: (d) => Array.isArray(d.booking_contacts) && d.booking_contacts.length > 0,
  },
  {
    title: "What to do when you're not on the course",
    blurb: "The best meal of the trip. The post-round bar. The sneaky par-3.",
    hasContent: (d) => Array.isArray(d.bonus_plays) && d.bonus_plays.length > 0,
  },
  {
    title: "From the captain",
    blurb: "Why this trip, what to expect, the things that make the difference.",
    hasContent: (d) => !!d.founder_note,
  },
];

export default function PreviewWhatsInside({ dest }: { dest: Destination }) {
  const sections = SECTIONS;
  if (sections.length === 0) return null;
  void dest;

  return (
    <section className="bg-[#F2F0EB] px-6 pt-20 pb-10 lg:px-16">
      <div className="mx-auto max-w-3xl">
        <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-[#2D5A3D]">
          What&apos;s inside the kit
        </p>
        <h2 className="mt-3 font-headline text-[36px] font-medium leading-tight tracking-tight text-[#111111] sm:text-[40px]">
          The rest of the trip
        </h2>
        <p className="mt-3 max-w-xl text-[14px] text-[#5A5A5A]">
          Five sections. Everything a captain needs to run this trip — not just dream about it.
        </p>

        <ul className="mt-10 divide-y divide-[#111111]/10">
          {sections.map((section) => (
            <li key={section.title} className="py-5">
              <div className="flex items-start gap-5">
                <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#111111]/15">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="h-3.5 w-3.5 text-[#111111]/40"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-headline text-[20px] font-medium leading-tight text-[#111111]">
                    {section.title}
                  </h3>
                  <p className="mt-1 text-[14px] leading-relaxed text-[#5A5A5A]">
                    {section.blurb}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
