import type { Metadata } from "next";
import DemoBadge from "@/components/DemoBadge";

export const metadata: Metadata = {
  title: "Demo — Nassau",
  robots: { index: false, follow: false },
};

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      {/* DEMO badge auto-hides on /demo/screenshots/* so marketing captures render clean. */}
      <DemoBadge />
    </>
  );
}
