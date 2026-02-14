import type { Metadata } from "next";
import localFont from "next/font/local";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff2",
  variable: "--font-geist-sans",
  weight: "100 900",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff2",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Nassau — The Golf Trip Companion",
  description:
    "Plan golf trips, manage itineraries, track expenses, generate pairings, and run skins games.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
      >
        <nav className="flex h-16 items-center justify-between border-b border-zinc-800 bg-zinc-900 px-6">
          <Link
            href="/"
            className="text-lg font-bold tracking-tight text-white"
          >
            Nassau
          </Link>
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  className="text-sm font-medium text-zinc-300 transition-colors hover:text-white"
                >
                  My Trips
                </Link>
                <span className="hidden text-xs text-zinc-500 sm:inline">
                  {user.email}
                </span>
                <form action="/auth/signout" method="post">
                  <button
                    type="submit"
                    className="rounded-md border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-300"
                  >
                    Sign Out
                  </button>
                </form>
              </>
            ) : (
              <Link
                href="/login"
                className="rounded-md bg-emerald-600 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-emerald-500"
              >
                Sign In
              </Link>
            )}
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
