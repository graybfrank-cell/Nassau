"use client";

import Link from "next/link";
import { HeroBackdrop } from "@/components/HeroBackdrop";
import { DEMO_DESTINATIONS } from "@/lib/demo-data";

export default function DemoExplorePage() {
  return (
    <div className="min-h-screen bg-[#F2F0EB] pb-16">
      {/* ── Hero ── */}
      <HeroBackdrop
        src="/heroes/hero-backdrop.png"
        alt="Golf course landscape"
        height="lg"
        priority
      >
        <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-white/60 mb-2">
          Explore destinations
        </p>
        <h1 className="font-headline text-4xl md:text-5xl tracking-tight">
          Where to next?
        </h1>
        <p className="mt-2 text-white/70 text-sm md:text-base">
          Browse trips planned by other captains
        </p>
      </HeroBackdrop>

      {/* ── Destination Grid ── */}
      <div className="mx-auto max-w-6xl px-6 mt-10">
        <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#8A8A8A]">
          {DEMO_DESTINATIONS.length} destinations
        </p>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {DEMO_DESTINATIONS.map((dest) => (
            <Link
              key={dest.slug}
              href="/demo/trip-wizard"
              className="group relative aspect-square overflow-hidden rounded-2xl transition-all hover:scale-[1.02]"
            >
              {/* Gradient placeholder */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#2D5A3D] to-[#1a3625]" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

              {/* Hover CTA */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
                <span className="rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-[#111111]">
                  Plan this trip →
                </span>
              </div>

              {/* Content */}
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <h3 className="font-headline text-xl font-medium text-white sm:text-2xl">
                  {dest.name}
                </h3>
                <p className="mt-1 text-sm text-white/60">{dest.price}</p>
                <p className="text-xs text-white/40">{dest.info}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
