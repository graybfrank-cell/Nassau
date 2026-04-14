import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Founding Members — Lock In $49.99/yr",
  description:
    "Only 88 founding member spots left. Lock in $49.99/yr forever with all Nassau Pro features, a founding badge, and priority support.",
  openGraph: {
    title: "Founding Members — Lock In $49.99/yr | Nassau",
    description:
      "Only 88 founding member spots left. Lock in $49.99/yr forever with all Nassau Pro features and a founding badge.",
    url: "https://nassau.golf/founding",
    siteName: "Nassau",
    type: "website",
    images: ["/og-image.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Founding Members — Lock In $49.99/yr | Nassau",
    description:
      "Only 88 founding member spots left. Lock in $49.99/yr forever with all Nassau Pro features and a founding badge.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: "https://nassau.golf/founding",
  },
};

export default function FoundingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
