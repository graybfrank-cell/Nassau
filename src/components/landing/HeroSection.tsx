"use client";

import { useState, FormEvent } from "react";
import Image from "next/image";

export default function HeroSection() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [count, setCount] = useState<number | null>(null);

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

      setSuccess(true);
      if (data.count) setCount(data.count);
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

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

      {/* Top bar */}
      <nav className="relative z-20 flex items-center justify-between px-6 py-5 lg:px-12">
        <span className="font-headline text-[20px] font-medium text-white">
          Nassau
        </span>
        <a
          href="mailto:hello@nassau.golf"
          className="text-sm text-white/70 transition-colors hover:text-white"
        >
          hello@nassau.golf
        </a>
      </nav>

      {/* Frosted glass card — top right */}
      <div className="absolute right-6 top-20 z-20 hidden rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur-md lg:right-12 lg:top-24 lg:block">
        <p className="text-sm font-semibold text-white">
          237 captains waiting &middot; May 2026
        </p>
      </div>

      {/* Hero content — bottom left */}
      <div className="relative z-10 mt-auto px-6 pb-24 lg:px-12">
        <h1 className="font-headline text-[56px] font-medium leading-[1.0] text-white sm:text-[72px]">
          All golf trips.
          <br />
          One link.
        </h1>
        <p className="mt-4 max-w-md text-[16px] leading-relaxed text-white/60">
          Plan the trip. Commit the crew. Play the rounds. Settle the bets. One
          link does it all.
        </p>

        {/* Waitlist form */}
        <div id="waitlist" className="mt-8 max-w-md">
          {success ? (
            <div>
              <p className="text-[16px] font-medium text-white">
                ✓ You&apos;re on the list. We&apos;ll be in touch.
              </p>
              {count && (
                <p className="mt-2 text-[13px] text-white/50">
                  You&apos;re captain #{count.toLocaleString()}
                </p>
              )}
            </div>
          ) : (
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
              {error && (
                <p className="mt-2 text-[13px] text-red-400">{error}</p>
              )}
              <p className="mt-3 text-[13px] text-white/50">
                Launching May 2026 · Join 237 captains on the waitlist
              </p>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
