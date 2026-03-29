import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Free to keep score. Pay when money is on the line. Starting at $6.99/mo.",
  openGraph: {
    title: "Nassau Pricing — Pick Your Play",
    description: "Free to keep score. Pay when money is on the line.",
    images: [
      "/api/og/default?title=Pick%20Your%20Play&subtitle=Free%20to%20keep%20score.%20Pay%20when%20money%20is%20on%20the%20line.",
    ],
  },
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
