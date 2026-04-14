import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Golf Trip Pricing — Free to Start",
  description:
    "Score rounds free forever. Upgrade to Nassau Pro at $6.99/mo for bet tracking, trip planning, and settlements. Start your free trial today.",
  openGraph: {
    title: "Golf Trip Pricing — Free to Start | Nassau",
    description:
      "Score rounds free forever. Upgrade to Nassau Pro at $6.99/mo for bet tracking, trip planning, and settlements.",
    url: "https://nassau.golf/pricing",
    siteName: "Nassau",
    type: "website",
    images: ["/og-image.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Golf Trip Pricing — Free to Start | Nassau",
    description:
      "Score rounds free forever. Upgrade to Nassau Pro at $6.99/mo for bet tracking, trip planning, and settlements.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: "https://nassau.golf/pricing",
  },
};

const pricingJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Nassau Pricing",
  url: "https://nassau.golf/pricing",
  description: "Pricing plans for Nassau golf trip management app.",
  mainEntity: {
    "@type": "SoftwareApplication",
    name: "Nassau",
    applicationCategory: "SportsApplication",
    operatingSystem: "Web",
    offers: [
      {
        "@type": "Offer",
        name: "Commissioner",
        price: "0",
        priceCurrency: "USD",
        description: "Free forever. Score rounds, basic skins tracking, shareable recap link.",
      },
      {
        "@type": "Offer",
        name: "Nassau Pro Monthly",
        price: "6.99",
        priceCurrency: "USD",
        description: "Full trip planning, bet tracking, expense splits, and live scorecards.",
      },
      {
        "@type": "Offer",
        name: "Nassau Pro Annual",
        price: "49.99",
        priceCurrency: "USD",
        description: "All Pro features billed annually. Save 40%.",
      },
      {
        "@type": "Offer",
        name: "Per-Trip Pass",
        price: "9.99",
        priceCurrency: "USD",
        description: "One trip, full Pro features, no subscription required.",
      },
    ],
  },
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pricingJsonLd) }}
      />
      {children}
    </>
  );
}
