import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Playfair_Display, Inter } from "next/font/google";
import { createClient } from "@/lib/supabase/server";
import NavBar from "@/components/NavBar";
import InstallBanner from "@/components/InstallBanner";
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
    default: "Nassau",
    template: "%s | Nassau",
  },
  description:
    "Run the trip. The operating system for golf trips — plan it, play it, settle it. All golf trips. One link.",
  metadataBase: new URL("https://nassau.golf"),
  openGraph: {
    title: "Nassau — Run the trip.",
    description:
      "Run the trip. The operating system for golf trips — plan it, play it, settle it. All golf trips. One link.",
    url: "https://nassau.golf",
    siteName: "Nassau",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Nassau — All golf trips. One link.",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Nassau — Run the trip.",
    description:
      "Run the trip. The operating system for golf trips — plan it, play it, settle it. All golf trips. One link.",
    images: ["/og-image.png"],
    creator: "@UseNassauGolf",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Nassau",
  },
  icons: {
    apple: "/icons/icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#2D5A3D",
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
        <InstallBanner />
      </body>
    </html>
  );
}
