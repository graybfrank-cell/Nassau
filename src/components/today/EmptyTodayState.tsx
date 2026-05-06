"use client";

type Mode = "loading" | "error" | "not-active";

type Props = {
  mode: Mode;
  message?: string;
  daysUntilStart?: number;
  onRetry?: () => void;
};

export default function EmptyTodayState({ mode, message, daysUntilStart, onRetry }: Props) {
  if (mode === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0A0A0A] px-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="h-2 w-2 animate-pulse rounded-full bg-[#C9A54E]" />
          <p className="font-mono text-[12px] uppercase tracking-[0.2em] text-cream/60">
            {message ?? "Loading today's view..."}
          </p>
        </div>
      </div>
    );
  }

  if (mode === "error") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0A0A0A] px-6">
        <div className="flex max-w-sm flex-col items-center gap-5 text-center">
          <h2 className="font-headline text-2xl text-cream">Something went sideways</h2>
          <p className="text-[14px] leading-relaxed text-cream/70">
            {message ?? "We couldn't load today's view. Try again in a moment."}
          </p>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="rounded-full border border-[#C9A54E]/40 px-5 py-2 font-mono text-[11px] uppercase tracking-[0.2em] text-[#C9A54E] transition hover:bg-[#C9A54E]/10"
            >
              Retry
            </button>
          )}
        </div>
      </div>
    );
  }

  // not-active
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0A0A0A] px-6">
      <div className="flex max-w-sm flex-col items-center gap-3 text-center">
        <h2 className="font-headline text-2xl text-cream">This trip isn&apos;t active yet</h2>
        {typeof daysUntilStart === "number" && daysUntilStart > 0 && (
          <p className="font-mono text-[12px] uppercase tracking-[0.2em] text-[#C9A54E]">
            {daysUntilStart} {daysUntilStart === 1 ? "day" : "days"} to go
          </p>
        )}
        {message && <p className="text-[14px] text-cream/60">{message}</p>}
      </div>
    </div>
  );
}
