import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Golf Trip Destinations — 15+ Curated Trips",
  description:
    "Explore top golf trip destinations from Bandon Dunes to St Andrews. Filter by vibe, budget, and season. Start planning your next golf trip with Nassau.",
  openGraph: {
    title: "Golf Trip Destinations — 15+ Curated Trips | Nassau",
    description:
      "Explore top golf trip destinations from Bandon Dunes to St Andrews. Filter by vibe, budget, and season.",
    url: "https://nassau.golf/explore",
    siteName: "Nassau",
    type: "website",
    images: ["/og-image.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Golf Trip Destinations — 15+ Curated Trips | Nassau",
    description:
      "Explore top golf trip destinations from Bandon Dunes to St Andrews. Filter by vibe, budget, and season.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: "https://nassau.golf/explore",
  },
};

export default function ExploreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
