import Link from "next/link";

const steps = [
  {
    num: "01",
    title: "Explore",
    desc: "50+ curated destinations with real pricing and insider intel.",
  },
  {
    num: "02",
    title: "Coordinate",
    desc: "One link. Your crew commits, votes on dates, and locks in.",
  },
  {
    num: "03",
    title: "Play",
    desc: "Live scorecards, skins, Nassau bets — calculated automatically.",
  },
  {
    num: "04",
    title: "Settle",
    desc: "Who owes who. One tap to Venmo. No spreadsheets.",
  },
];

export default function HowItWorks() {
  return (
    <section id="features" className="bg-[#F2F0EB] px-6 py-24 lg:px-16">
      <div className="mx-auto max-w-6xl">
        <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#8A8A8A]">
          How it works
        </p>
        <h2 className="mt-3 font-headline text-[36px] font-medium leading-tight tracking-tight text-[#111111] sm:text-[40px]">
          A new standard in golf
          <br className="hidden sm:block" /> trip coordination
        </h2>
        <p className="mt-3 max-w-lg text-[16px] text-[#111111]/60">
          From &ldquo;we should do a trip&rdquo; to &ldquo;that was the best
          trip ever&rdquo; &mdash; one app.
        </p>

        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2">
          {steps.map((step) => (
            <div
              key={step.num}
              className="rounded-2xl bg-white p-8 shadow-sm transition-shadow hover:shadow-md"
            >
              <span className="font-headline text-[48px] font-medium leading-none text-[#2D5A3D]">
                {step.num}
              </span>
              <h3 className="mt-4 text-lg font-semibold text-[#111111]">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[#8A8A8A]">
                {step.desc}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-10">
          <Link
            href="/explore"
            className="inline-block rounded-full bg-[#2D5A3D] px-8 py-3 text-sm font-semibold text-[#F2F0EB] transition-colors hover:bg-[#244B33]"
          >
            Explore Destinations &rarr;
          </Link>
        </div>
      </div>
    </section>
  );
}
