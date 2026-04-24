const steps = [
  {
    num: "01",
    title: "Plan",
    desc: "Pick a destination. Set the dates. Build the itinerary.",
  },
  {
    num: "02",
    title: "Commit",
    desc: "Share one link. Your crew locks in. Dues tracked automatically.",
  },
  {
    num: "03",
    title: "Play",
    desc: "Live scoring. Skins. Nassau bets. The math is automatic.",
  },
  {
    num: "04",
    title: "Settle",
    desc: "Who owes who. One tap to Venmo. Done.",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-[#F2F0EB] px-6 py-24 lg:px-16">
      <div className="mx-auto max-w-6xl">
        <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#8A8A8A]">
          How it works
        </p>
        <h2 className="mt-3 font-headline text-[36px] font-medium leading-tight tracking-tight text-[#111111] sm:text-[40px]">
          What &ldquo;one link&rdquo; actually means
        </h2>

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
      </div>
    </section>
  );
}
