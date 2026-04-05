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
    default: "Nassau — All Golf Trips. One Link.",
    template: "%s | Nassau",
  },
  description:
    "The operating system for golf trips. Plan it. Commit the crew. Play the rounds. Settle the bets. Launching April 2026.",
  metadataBase: new URL("https://nassau.golf"),
  openGraph: {
    title: "Nassau — All Golf Trips. One Link.",
    description:
      "The operating system for golf trips. Plan it. Commit the crew. Play the rounds. Settle the bets. Launching April 2026.",
    url: "https://nassau.golf",
    siteName: "Nassau",
    images: [
      {
        url: "/api/og/default?title=Nassau&subtitle=All%20Golf%20Trips.%20One%20Link.",
        width: 1200,
        height: 630,
        alt: "Nassau — All Golf Trips. One Link.",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Nassau — All Golf Trips. One Link.",
    description:
      "The operating system for golf trips. Plan it. Commit the crew. Play the rounds. Settle the bets. Launching April 2026.",
    images: ["/api/og/default?title=Nassau&subtitle=All%20Golf%20Trips.%20One%20Link."],
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
