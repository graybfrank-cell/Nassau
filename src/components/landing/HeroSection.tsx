"use client";

import { useState, FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";

// Waitlist form retained for relocation in Prompt 09's landing work.
// Intentionally defined but not mounted in the hero for launch.
export function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong. Try again.");
        return;
      }
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex items-center">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          className="w-full max-w-md rounded-full border border-white/20 bg-white/10 px-6 py-4 text-white placeholder:text-white/40 backdrop-blur-md outline-none"
        />
        <button
          type="submit"
          disabled={loading}
          className="ml-2 whitespace-nowrap rounded-full bg-[#2D5A3D] px-6 py-3 text-white transition-colors hover:bg-[#244B33] disabled:opacity-50"
        >
          {loading ? "Joining…" : "Join waitlist →"}
        </button>
      </div>
      {error && <p className="mt-2 text-[13px] text-red-400">{error}</p>}
    </form>
  );
}

export default function HeroSection() {
  return (
    <section className="relative flex min-h-screen flex-col overflow-hidden">
      {/* Background image */}
      <Image
        src="/images/hero-backdrop.png"
        alt="Golf course at dawn"
        fill
        priority
        className="object-cover"
      />
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/70" />

      {/* Hero content — bottom left */}
      <div className="relative z-10 mt-auto px-6 pb-24 lg:px-12">
        <h1 className="font-headline text-[56px] font-medium leading-[1.0] text-white sm:text-[72px]">
          Run the trip.
        </h1>
        <p className="mt-4 max-w-md text-[18px] leading-relaxed text-white/80">
          Plan it. Play it. Settle it.
        </p>
        <p className="mt-3 max-w-md text-[14px] leading-relaxed text-white/50">
          The operating system for golf trips.
        </p>

        {/* CTAs */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Link
            href="/login?next=/trips/new"
            className="inline-flex items-center justify-center whitespace-nowrap rounded-full bg-[#2D5A3D] px-6 py-3 text-white transition-colors hover:bg-[#244B33]"
          >
            Plan a trip →
          </Link>
          <a
            href="#how-it-works"
            onClick={(e) => {
              e.preventDefault();
              document
                .getElementById("how-it-works")
                ?.scrollIntoView({ behavior: "smooth" });
            }}
            className="inline-flex items-center justify-center whitespace-nowrap rounded-full border border-white/30 bg-transparent px-6 py-3 text-white transition-colors hover:bg-white/10"
          >
            See how it works
          </a>
        </div>

        <p className="mt-6 text-[13px] text-white/50">
          Built for the captain. Used by your group.
        </p>
      </div>
    </section>
  );
}
