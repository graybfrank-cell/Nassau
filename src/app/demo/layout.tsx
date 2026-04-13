import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Demo — Nassau",
  robots: "noindex, nofollow",
};

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      {/* DEMO badge — fixed top-right, small enough to crop from 9:16 recordings */}
      <div
        className="fixed top-4 right-4 z-[999] select-none pointer-events-none"
        style={{ fontSize: 9, fontWeight: 500, letterSpacing: "0.1em", color: "#8A8A8A" }}
      >
        DEMO
      </div>
    </>
  );
}
