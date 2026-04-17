"use client";

import { usePathname } from "next/navigation";

/**
 * The small "DEMO" watermark that sits in the top-right corner of every
 * /demo/* page.  We hide it on the chrome-free /demo/screenshots/* routes
 * so marketing screenshots come out clean.
 */
export default function DemoBadge() {
  const pathname = usePathname();
  if (pathname?.startsWith("/demo/screenshots")) return null;
  return (
    <div
      className="fixed top-4 right-4 z-[999] select-none pointer-events-none"
      style={{ fontSize: 9, fontWeight: 500, letterSpacing: "0.1em", color: "#8A8A8A" }}
    >
      DEMO
    </div>
  );
}
