import type { Metadata, Viewport } from "next";

/**
 * Chrome-free layout for marketing screenshot routes.
 *
 * - No NavBar (already hidden by NavBar.tsx on /demo/* paths)
 * - No DEMO badge (DemoBadge.tsx returns null on /demo/screenshots/* paths)
 * - Dark background bleeds to edges (#18181B) for full-bleed captures
 * - viewport is tuned to iPhone 15 Pro (width 390) so portrait phones render
 *   the content edge-to-edge without horizontal scroll
 *
 * Each child route renders the same JSX as its counterpart in /demo/{route}
 * — we simply re-export the component so nothing drifts.
 */
export const metadata: Metadata = {
  title: "Nassau — Screenshot Capture",
  robots: "noindex, nofollow",
};

export const viewport: Viewport = {
  width: 390,
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function ScreenshotsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="min-h-screen overflow-x-hidden bg-[#18181B]"
      data-nassau-capture="true"
    >
      {children}
    </div>
  );
}
