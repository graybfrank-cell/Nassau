"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";

const paths = [
  {
    emoji: "\uD83D\uDCCB",
    title: "I Have a Plan",
    description: "I know where we're going. Let me set it up.",
    href: "/trips/create",
    available: true,
  },
  {
    emoji: "\uD83E\uDD16",
    title: "Help Me Figure It Out",
    description:
      "Not sure where to go? Answer a few questions and our AI will plan the perfect trip.",
    href: "/trips/create/ai",
    available: true,
  },
  {
    emoji: "\uD83D\uDD0D",
    title: "Browse Trips",
    description: "Explore pre-built trip templates from top destinations.",
    href: "/explore",
    available: false,
  },
];

export default function NewTripPage() {
  return (
    <div className="min-h-[calc(100vh-64px)] bg-dark">
      {/* ── BANNER ── */}
      <div className="relative h-40 sm:h-48 overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1629293821782-4746e8921c75?q=80&w=2070&auto=format&fit=crop"
          alt="Golf trip planning"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-dark/80 via-dark/60 to-dark" />
        <div className="relative z-10 flex h-full items-end px-5 pb-5">
          <div>
            <h1 className="text-[22px] font-medium text-cream tracking-tight">Plan Your Trip</h1>
            <p className="text-[13px] text-cream/50">How would you like to get started?</p>
          </div>
        </div>
      </div>

      <div className="px-6 pt-6 pb-10">
        <div className="mx-auto max-w-2xl">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-sm text-cream/50 transition-colors hover:text-cream/70"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>

          <div className="mt-10 space-y-4">
            {paths.map((path) => (
              <Link
                key={path.title}
                href={path.href}
                className="group relative block rounded-2xl border border-cream/10 bg-cream/[0.06] p-6 transition-all hover:border-coral/40 hover:bg-cream/[0.08]"
              >
                {!path.available && (
                  <span className="absolute right-4 top-4 rounded-full bg-cream/10 px-2.5 py-0.5 text-xs font-medium text-cream/50">
                    Coming Soon
                  </span>
                )}
                <div className="flex items-start gap-4">
                  <span className="text-4xl">{path.emoji}</span>
                  <div>
                    <h2 className="text-lg font-semibold text-cream group-hover:text-coral">
                      {path.title}
                    </h2>
                    <p className="mt-1 text-sm text-cream/50">
                      {path.description}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
