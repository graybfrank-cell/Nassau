"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

const PUBLIC_ROUTES = ["/", "/explore", "/pricing", "/founding", "/blog", "/trip/preview"];
const APP_ROUTES = ["/dashboard", "/rounds", "/trips", "/scorecard", "/settlements", "/profile"];

type User = { email?: string } | null;

export default function NavBar({ user }: { user: User }) {
  const pathname = usePathname();

  // Hide NavBar entirely on app routes — they have their own internal nav
  const isAppRoute = APP_ROUTES.some(
    (r) => pathname === r || pathname.startsWith(r + "/")
  );
  if (isAppRoute) return null;

  const isPublic = PUBLIC_ROUTES.some(
    (r) => pathname === r || (r !== "/" && pathname.startsWith(r))
  );

  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (!isPublic) return;
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [isPublic]);

  // Public routes — transparent → cream on scroll
  return (
    <nav
      className={`fixed left-0 right-0 top-0 z-50 flex h-16 items-center justify-between px-6 transition-all duration-300 ${
        scrolled ? "bg-[#F2F0EB] shadow-sm" : "bg-transparent"
      }`}
    >
      <Link href="/" className="flex items-center gap-2">
        <span
          className={`text-xl font-semibold uppercase tracking-tighter transition-colors ${
            scrolled ? "text-[#111111]" : "text-white"
          }`}
        >
          NASSAU
        </span>
      </Link>
      <div className="flex items-center gap-4">
        {user ? (
          <>
            <Link
              href="/dashboard"
              className={`text-sm font-medium transition-colors ${
                scrolled
                  ? "text-[#111111] hover:text-[#2D5A3D]"
                  : "text-white/80 hover:text-white"
              }`}
            >
              Trips
            </Link>
            <Link
              href="/rounds"
              className={`text-sm font-medium transition-colors ${
                scrolled
                  ? "text-[#111111] hover:text-[#2D5A3D]"
                  : "text-white/80 hover:text-white"
              }`}
            >
              Rounds
            </Link>
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                  scrolled
                    ? "border-[#111111]/20 text-[#111111] hover:border-[#2D5A3D]"
                    : "border-white/30 text-white hover:border-[#2D5A3D]"
                }`}
              >
                Sign Out
              </button>
            </form>
          </>
        ) : (
          <a
            href="mailto:hello@nassau.golf"
            className={`text-sm font-medium transition-colors ${
              scrolled
                ? "text-[#111111] hover:text-[#2D5A3D]"
                : "text-white/70 hover:text-white"
            }`}
          >
            hello@nassau.golf
          </a>
        )}
      </div>
    </nav>
  );
}
