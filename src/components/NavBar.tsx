"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

const APP_ROUTES: string[] = ["/dashboard", "/trips", "/rounds", "/profile", "/settings"];

type User = { email?: string } | null;

export default function NavBar({ user }: { user: User }): React.JSX.Element {
  const pathname: string = usePathname();
  const isApp: boolean = APP_ROUTES.some((r: string) => pathname.startsWith(r));

  const InstagramIcon = (): React.JSX.Element => (
    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  );

  const XIcon = (): React.JSX.Element => (
    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );

  /* ─── Authenticated app nav (dark) ─── */
  if (user && isApp) {
    return (
      <nav className="flex h-16 items-center justify-between border-b px-6 transition-colors bg-zinc-950 border-zinc-800">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo-n.png" alt="Nassau" width={28} height={28} className="rounded" />
          <span className="text-lg font-bold tracking-tight transition-colors text-white">Nassau</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-sm font-medium transition-colors text-zinc-400 hover:text-white">Trips</Link>
          <Link href="/rounds" className="text-sm font-medium transition-colors text-zinc-400 hover:text-white">Rounds</Link>
          <a href="https://instagram.com/golfnassau" target="_blank" rel="noopener noreferrer" className="transition-colors text-zinc-500 hover:text-white" aria-label="Instagram">
            <InstagramIcon />
          </a>
          <a href="https://x.com/UseNassauGolf" target="_blank" rel="noopener noreferrer" className="transition-colors text-zinc-500 hover:text-white" aria-label="X/Twitter">
            <XIcon />
          </a>
          <span className="hidden text-xs sm:inline text-zinc-500">{user.email}</span>
          <form action="/auth/signout" method="post">
            <button type="submit" className="rounded-md border px-3 py-1.5 text-xs font-medium transition-colors border-zinc-700 text-zinc-400 hover:border-[#D94F2B] hover:text-white">
              Sign Out
            </button>
          </form>
        </div>
      </nav>
    );
  }

  /* ─── Public cream nav ─── */
  return (
    <nav
      className="sticky top-0 z-50 flex h-16 items-center justify-between px-6 bg-[#F3EDE4]"
      style={{ fontFamily: "'Helvetica Neue', Arial, sans-serif" }}
    >
      <Link href="/" className="flex items-center">
        <span className="text-xl font-black uppercase tracking-tighter text-[#18181B]">
          NASSAU
        </span>
      </Link>
      <div className="flex items-center gap-4">
        {user ? (
          <>
            <Link href="/dashboard" className="text-sm font-bold text-[#D94F2B] transition-colors hover:text-[#c4442a]">
              Dashboard
            </Link>
            <form action="/auth/signout" method="post">
              <button type="submit" className="rounded-lg bg-[#D94F2B] px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-[#c4442a]">
                Sign Out
              </button>
            </form>
          </>
        ) : (
          <>
            <Link href="/login" className="text-sm font-bold text-[#D94F2B] transition-colors hover:text-[#c4442a]">
              Login
            </Link>
            <Link href="/login" className="rounded-lg bg-[#D94F2B] px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-[#c4442a]">
              Get Started Free
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
