import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Partnerships | Nassau",
  description:
    "Nassau for golf travel operators. Volume pricing, white-label dashboards, API access for agencies, creators, and resort teams.",
  openGraph: {
    title: "Partnerships | Nassau",
    description:
      "Nassau for golf travel operators. Volume pricing, white-label dashboards, API access for agencies, creators, and resort teams.",
    url: "https://nassau.golf/partnerships",
    siteName: "Nassau",
    type: "website",
    images: ["/og-image.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Partnerships | Nassau",
    description:
      "Nassau for golf travel operators. Volume pricing, white-label dashboards, API access for agencies, creators, and resort teams.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: "https://nassau.golf/partnerships",
  },
};

export default function PartnershipsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
