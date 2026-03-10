import type { Metadata } from "next";
import localFont from "next/font/local";
import { createClient } from "@/lib/supabase/server";
import "./globals.css";
import NavBarClient from "./nav-bar-client";

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
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
      >
        <NavBarClient
          user={user ? { id: user.id, email: user.email ?? null } : null}
        />
        {children}
      </body>
    </html>
  );
}
