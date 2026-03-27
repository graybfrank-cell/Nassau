"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

const PUBLIC_ROUTES = ["/", "/explore", "/pricing", "/founding", "/blog"];
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
        scrolled ? "bg-[#F3EDE4] shadow-sm" : "bg-transparent"
      }`}
    >
      <Link href="/" className="flex items-center gap-2">
        <span
          className={`text-xl font-black uppercase tracking-tighter transition-colors ${
            scrolled ? "text-[#18181B]" : "text-white"
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
                  ? "text-[#18181B] hover:text-[#D94F2B]"
                  : "text-white/80 hover:text-white"
              }`}
            >
              Trips
            </Link>
            <Link
              href="/rounds"
              className={`text-sm font-medium transition-colors ${
                scrolled
                  ? "text-[#18181B] hover:text-[#D94F2B]"
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
                    ? "border-[#18181B]/20 text-[#18181B] hover:border-[#D94F2B]"
                    : "border-white/30 text-white hover:border-[#D94F2B]"
                }`}
              >
                Sign Out
              </button>
            </form>
          </>
        ) : (
          <>
            <Link
              href="/login"
              className={`text-sm font-bold transition-colors ${
                scrolled ? "text-[#D94F2B]" : "text-[#D94F2B]"
              }`}
            >
              Login
            </Link>
            <Link
              href="/login"
              className="rounded-lg bg-[#D94F2B] px-4 py-2 text-sm font-black uppercase text-white transition-colors hover:bg-[#c4442a]"
            >
              Get Started Free
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
