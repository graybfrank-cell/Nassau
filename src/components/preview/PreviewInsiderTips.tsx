export default function PreviewInsiderTips({ tips }: { tips: string[] }) {
  const display = tips.slice(0, 5);
  if (display.length === 0) return null;

  return (
    <section className="bg-[#F2F0EB] px-6 py-16 lg:px-16">
      <div className="mx-auto max-w-4xl">
        <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#8A8A8A]">
          From captains who&apos;ve been
        </p>
        <h2 className="mt-3 font-headline text-[32px] font-medium leading-tight tracking-tight text-[#111111] sm:text-[36px]">
          Insider tips
        </h2>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {display.map((tip, i) => (
            <div
              key={i}
              className="rounded-2xl bg-white p-5 shadow-sm"
            >
              <span className="text-xs font-medium text-[#2D5A3D]">
                Tip {String(i + 1).padStart(2, "0")}
              </span>
              <p className="mt-2 text-sm leading-relaxed text-[#111111]">
                {tip}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
