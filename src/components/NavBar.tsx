"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

const APP_ROUTES = ["/dashboard", "/trips", "/rounds", "/profile", "/settings"];

type User = { email?: string } | null;

export default function NavBar({ user }: { user: User }) {
  const pathname = usePathname();
  const isDark = APP_ROUTES.some((r) => pathname.startsWith(r));

  const nav = isDark
    ? {
        bg: "bg-zinc-950 border-zinc-800",
        logo: "text-white",
        link: "text-zinc-400 hover:text-white",
        icon: "text-zinc-500 hover:text-white",
        email: "text-zinc-500",
        signout: "border-zinc-700 text-zinc-400 hover:border-[#D94F2B] hover:text-white",
      }
    : {
        bg: "bg-[#FDFAF5] border-[#E2D9CC]",
        logo: "text-[#1A1A1A]",
        link: "text-[#6A6058] hover:text-[#1A1A1A]",
        icon: "text-[#8A8078] hover:text-[#1A1A1A]",
        email: "text-[#8A8078]",
        signout: "border-[#E2D9CC] text-[#8A8078] hover:border-[#D94F2B] hover:text-[#1A1A1A]",
      };

  const InstagramIcon = () => (
    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
    </svg>
  );

  const XIcon = () => (
    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  );

  return (
    <nav className={`flex h-16 items-center justify-between border-b px-6 transition-colors ${nav.bg}`}>
      <Link href="/" className="flex items-center gap-2">
        <Image src="/logo-n.png" alt="Nassau" width={28} height={28} className="rounded" />
        <span className={`text-lg font-bold tracking-tight transition-colors ${nav.logo}`}>Nassau</span>
      </Link>
      <div className="flex items-center gap-4">
        {user ? (
          <>
            <Link href="/dashboard" className={`text-sm font-medium transition-colors ${nav.link}`}>Trips</Link>
            <Link href="/rounds" className={`text-sm font-medium transition-colors ${nav.link}`}>Rounds</Link>
            <a href="https://instagram.com/golfnassau" target="_blank" rel="noopener noreferrer" className={`transition-colors ${nav.icon}`} aria-label="Instagram">
              <InstagramIcon />
            </a>
            <a href="https://x.com/UseNassauGolf" target="_blank" rel="noopener noreferrer" className={`transition-colors ${nav.icon}`} aria-label="X/Twitter">
              <XIcon />
            </a>
            <span className={`hidden text-xs sm:inline ${nav.email}`}>{user.email}</span>
            <form action="/auth/signout" method="post">
              <button type="submit" className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${nav.signout}`}>
                Sign Out
              </button>
            </form>
          </>
        ) : (
          <>
            <a href="https://instagram.com/golfnassau" target="_blank" rel="noopener noreferrer" className={`transition-colors ${nav.icon}`} aria-label="Instagram">
              <InstagramIcon />
            </a>
            <a href="https://x.com/UseNassauGolf" target="_blank" rel="noopener noreferrer" className={`transition-colors ${nav.icon}`} aria-label="X/Twitter">
              <XIcon />
            </a>
            <Link href="/login" className="rounded-md bg-[#D94F2B] px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-[#c4442a]">
              Sign In
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
