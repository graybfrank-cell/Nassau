import type { Metadata } from "next";
import localFont from "next/font/local";
import { Playfair_Display, Inter } from "next/font/google";
import { createClient } from "@/lib/supabase/server";
import NavBar from "@/components/NavBar";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  weight: ["400", "500", "600"],
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500", "600"],
  display: "swap",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff2",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: {
    default: "Nassau — The Golf Trip Companion",
    template: "%s | Nassau",
  },
  description:
    "Nassau is the operating system for golf trips. Plan trips, coordinate your crew, track rounds, and settle bets — all in one app.",
  metadataBase: new URL("https://nassau.golf"),
  openGraph: {
    title: "Nassau — The Golf Trip Companion",
    description:
      "Nassau is the operating system for golf trips. Plan trips, coordinate your crew, track rounds, and settle bets — all in one app.",
    url: "https://nassau.golf",
    siteName: "Nassau",
    images: [
      {
        url: "/api/og/default?title=Nassau&subtitle=The Golf Trip Companion",
        width: 1200,
        height: 630,
        alt: "Nassau — The Golf Trip Companion",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Nassau — The Golf Trip Companion",
    description:
      "Nassau is the operating system for golf trips. Plan trips, coordinate your crew, track rounds, and settle bets — all in one app.",
    images: ["/api/og/default?title=Nassau&subtitle=The Golf Trip Companion"],
    creator: "@UseNassauGolf",
  },
};

async function getUser() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  } catch {
    return null;
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getUser();

  return (
    <html lang="en">
      <body className={`${playfair.variable} ${inter.variable} ${geistMono.variable} font-sans antialiased`}>
        <NavBar user={user} />
        {children}
      </body>
    </html>
  );
}
