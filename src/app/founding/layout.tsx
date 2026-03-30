import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Founding Members",
  description:
    "88 founding member spots remaining. Lock in $49.99/yr forever.",
  openGraph: {
    title: "Nassau Founding Members — 88 Spots Left",
    description: "Lock in $49.99/yr forever. 88 founding member spots remaining.",
    images: [
      "/api/og/default?title=Founding%20Members&subtitle=88%20spots%20remaining.%20%2449.99%2Fyr%20locked%20forever.",
    ],
  },
};

export default function FoundingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
