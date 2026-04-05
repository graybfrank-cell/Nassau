"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";

export default function CTASection() {
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
    <section className="bg-[#111111] px-6 py-24 text-center">
      <div className="mx-auto max-w-2xl">
        <h2 className="font-headline text-[56px] font-medium leading-[1.0] text-white">
          All golf trips.
          <br />
          One link.
        </h2>
        <p className="mt-4 text-[16px] text-[#8A8A8A]">
          Be first in line when Nassau opens to captains in April.
        </p>

        {/* Waitlist form */}
        <div className="mx-auto mt-10 max-w-md">
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
              <div className="flex items-center overflow-hidden rounded-full bg-white/10 backdrop-blur">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="flex-1 bg-transparent px-6 py-3.5 text-sm text-white placeholder-white/40 outline-none"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="mr-1.5 whitespace-nowrap rounded-full bg-[#2D5A3D] px-6 py-3 text-sm text-white transition-colors hover:bg-[#244B33] disabled:opacity-50"
                >
                  {loading ? "Joining…" : "Join waitlist →"}
                </button>
              </div>
              {error && (
                <p className="mt-2 text-[13px] text-red-400">{error}</p>
              )}
            </form>
          )}
        </div>

        {/* Social icons */}
        <div className="mt-8 flex items-center justify-center gap-6">
          {/* X / Twitter */}
          <a
            href="https://x.com/UseNassauGolf"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#8A8A8A] transition-colors hover:text-white"
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </a>
          {/* Instagram */}
          <a
            href="https://instagram.com/golfnassau"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#8A8A8A] transition-colors hover:text-white"
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C16.67.014 16.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
            </svg>
          </a>
        </div>

        {/* Footer links */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-6">
          <a
            href="mailto:grayson@nassau.golf"
            className="text-sm text-[#8A8A8A] transition-colors hover:text-[#F2F0EB]"
          >
            Feedback
          </a>
          <Link
            href="/privacy"
            className="text-sm text-[#8A8A8A] transition-colors hover:text-[#F2F0EB]"
          >
            Privacy
          </Link>
          <Link
            href="/terms"
            className="text-sm text-[#8A8A8A] transition-colors hover:text-[#F2F0EB]"
          >
            Terms
          </Link>
          <a
            href="mailto:support@nassau.golf"
            className="text-sm text-[#8A8A8A] transition-colors hover:text-[#F2F0EB]"
          >
            Support
          </a>
        </div>

        <p className="mt-6 text-xs text-[#8A8A8A]">
          Nassau &mdash; Built in Austin, TX &middot; Launching April 2026
        </p>
      </div>
    </section>
  );
}
