import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Founding Members",
  description:
    "First 100 golfers get Nassau Pro free for a year. Lock in $49.99/yr forever.",
  openGraph: {
    title: "Nassau Founding Members — 47 Spots Left",
    description: "Lock in $49.99/yr forever. First 100 golfers only.",
    images: [
      "/api/og/default?title=Founding%20Members&subtitle=47%20spots%20remaining.%20%2449.99%2Fyr%20locked%20forever.",
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
