import type { Metadata } from "next";
import localFont from "next/font/local";
import Link from "next/link";
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
      >
        <nav className="flex h-16 items-center justify-between border-b border-zinc-800 bg-zinc-900 px-6">
          <Link href="/" className="text-lg font-bold tracking-tight text-white">
            Nassau
          </Link>
          <span className="text-xs text-zinc-400">nassau.golf</span>
        </nav>
        {children}
      </body>
    </html>
  );
}
