import Link from "next/link";

/**
 * Index page for chrome-free marketing screenshot routes.
 *
 * Each link below points to a capture-ready rendering of a key product
 * surface. When captured at 390 x 844 (iPhone 15 Pro logical size) these
 * fit cleanly inside a 1080 x 1350 Instagram carousel slide.
 */
const ROUTES: {
  href: string;
  label: string;
  description: string;
}[] = [
  {
    href: "/demo/screenshots/command-center",
    label: "Captain's Command Center",
    description:
      "Hero shot: trip dashboard, lodging, 3 confirmed tee times, 6-player crew, total contributions $14,235.",
  },
  {
    href: "/demo/screenshots/trip-wizard",
    label: "Trip Wizard — Step 3",
    description:
      "Trip creation summary: Bandon Dunes, 6 players, May 8–11 2026, est. $2,847/person.",
  },
  {
    href: "/demo/screenshots/scorecard",
    label: "Scorecard — Pacific Dunes FINAL",
    description:
      "Final scorecard with hole-by-hole colors, totals, and net/HCP math.",
  },
  {
    href: "/demo/screenshots/settlements",
    label: "Settlements",
    description:
      "Who owes who, You Owe $0 / Owed to You $35, Venmo-linked rows.",
  },
  {
    href: "/demo/screenshots/share",
    label: "Trip Share & Invite",
    description:
      "Share link, copy button, crew status bar (4 of 6 committed), invitee list.",
  },
  {
    href: "/demo/screenshots/explore",
    label: "Explore",
    description:
      "'Where to next?' hero, 3-4 destination cards visible above the fold.",
  },
];

export default function ScreenshotsIndex() {
  return (
    <div className="min-h-screen bg-[#18181B] text-white px-6 py-10">
      <div className="mx-auto max-w-xl">
        <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-white/50 mb-2">
          Nassau · Marketing
        </p>
        <h1 className="font-serif text-3xl font-medium tracking-tight">
          Chrome-free screenshot routes
        </h1>
        <p className="mt-3 text-sm text-white/70 leading-relaxed">
          Capture each of the routes below at 390&nbsp;×&nbsp;844 (iPhone 15
          Pro) for clean, DEMO-badge-free marketing assets. Each route renders
          the exact same JSX as its counterpart in <code>/demo/*</code>, so
          product polish keeps the captures in lockstep.
        </p>

        <div className="mt-8 space-y-2.5">
          {ROUTES.map((r) => (
            <Link
              key={r.href}
              href={r.href}
              className="block rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3.5 hover:bg-white/[0.06] hover:border-white/20 transition-colors"
            >
              <div className="flex items-baseline justify-between gap-3">
                <p className="font-sans font-semibold text-sm text-white">
                  {r.label}
                </p>
                <span className="font-mono text-[11px] text-white/40 whitespace-nowrap">
                  {r.href.replace("/demo/screenshots", "")}
                </span>
              </div>
              <p className="mt-1 text-xs text-white/55 leading-snug">
                {r.description}
              </p>
            </Link>
          ))}
        </div>

        <p className="mt-10 text-xs text-white/40">
          Tip: in Chrome DevTools, select iPhone 15 Pro in device mode,
          disable the device toolbar if visible, then press
          <kbd className="mx-1 rounded bg-white/10 px-1.5 py-0.5 font-mono text-[10px]">
            Cmd+Shift+P
          </kbd>
          → &ldquo;Capture full size screenshot.&rdquo;
        </p>
      </div>
    </div>
  );
}
