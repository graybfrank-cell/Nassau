"use client";

import { useState } from "react";

export default function PartnershipsPage() {
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSend() {
    setError(null);
    if (!name.trim() || !company.trim() || !email.trim()) {
      setError("Name, company, and email are required.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/partnerships/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, company, email, phone, message }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }
      setSubmitted(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen" style={{ backgroundColor: "#F2F0EB" }}>
      {/* HERO */}
      <section className="pt-32 pb-20 px-6 text-center max-w-3xl mx-auto">
        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-[#8A8A8A] mb-6">
          Partnerships
        </p>
        <h1 className="font-headline text-5xl md:text-7xl font-medium tracking-tighter text-[#111111] leading-none">
          Nassau for golf travel operators.
        </h1>
        <p className="mt-6 text-lg text-[#111111]/70">
          Agencies, content creators, concierges, and resort teams use Nassau
          as the operating layer for the trips they run.
        </p>
      </section>

      {/* WHAT WE OFFER */}
      <section className="px-6 lg:px-16 pb-20">
        <div className="mx-auto max-w-5xl grid gap-10 md:grid-cols-3">
          <div>
            <h3 className="font-headline text-[24px] font-medium tracking-tight text-[#111111]">
              Volume pricing
            </h3>
            <p className="mt-3 text-sm text-[#111111]/70 leading-relaxed">
              Bulk passes, custom billing, transparent margins.
            </p>
          </div>
          <div>
            <h3 className="font-headline text-[24px] font-medium tracking-tight text-[#111111]">
              White-label dashboards
            </h3>
            <p className="mt-3 text-sm text-[#111111]/70 leading-relaxed">
              Your brand on the trip page your clients see.
            </p>
          </div>
          <div>
            <h3 className="font-headline text-[24px] font-medium tracking-tight text-[#111111]">
              API access
            </h3>
            <p className="mt-3 text-sm text-[#111111]/70 leading-relaxed">
              Integrate Nassau&apos;s coordination layer into your existing
              ops.
            </p>
          </div>
        </div>
      </section>

      {/* QUOTE */}
      <section className="px-6 pb-24">
        <div className="mx-auto max-w-3xl text-center">
          <p className="font-headline text-2xl md:text-3xl font-medium leading-snug tracking-tight text-[#111111]">
            &ldquo;Nassau was built for the captain who organizes trips for
            their friends. But the operating layer underneath works just as
            well for the professional who does it for a living. If that&apos;s
            you, let&apos;s talk.&rdquo;
          </p>
          <p className="mt-6 text-sm uppercase tracking-[0.12em] text-[#8A8A8A]">
            — Grayson, Nassau
          </p>
        </div>
      </section>

      {/* CONTACT FORM */}
      <section className="bg-[#111111] py-24 px-6">
        <div className="mx-auto max-w-xl rounded-2xl bg-[#F2F0EB] p-10 shadow-sm">
          <h2 className="font-headline text-4xl md:text-5xl font-medium tracking-tighter text-[#111111] leading-none">
            Let&apos;s talk.
          </h2>

          {submitted ? (
            <p className="mt-8 text-base text-[#2D5A3D] font-medium">
              Thanks. Grayson will be in touch within 2 business days.
            </p>
          ) : (
            <div className="mt-8 flex flex-col gap-4">
              <div>
                <label className="text-[11px] font-medium uppercase tracking-[0.12em] text-[#8A8A8A]">
                  Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-2 w-full bg-transparent border-b border-[#111111]/20 px-0 py-3 text-[#111111] focus:outline-none focus:border-[#2D5A3D] transition-colors"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium uppercase tracking-[0.12em] text-[#8A8A8A]">
                  Company
                </label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="mt-2 w-full bg-transparent border-b border-[#111111]/20 px-0 py-3 text-[#111111] focus:outline-none focus:border-[#2D5A3D] transition-colors"
                  placeholder="Company"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium uppercase tracking-[0.12em] text-[#8A8A8A]">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-2 w-full bg-transparent border-b border-[#111111]/20 px-0 py-3 text-[#111111] focus:outline-none focus:border-[#2D5A3D] transition-colors"
                  placeholder="you@company.com"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium uppercase tracking-[0.12em] text-[#8A8A8A]">
                  Phone <span className="normal-case tracking-normal text-[#8A8A8A]/70">(optional)</span>
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-2 w-full bg-transparent border-b border-[#111111]/20 px-0 py-3 text-[#111111] focus:outline-none focus:border-[#2D5A3D] transition-colors"
                  placeholder="Phone"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium uppercase tracking-[0.12em] text-[#8A8A8A]">
                  Tell us about your operation
                </label>
                <textarea
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="mt-2 w-full bg-transparent border-b border-[#111111]/20 px-0 py-3 text-[#111111] focus:outline-none focus:border-[#2D5A3D] transition-colors resize-none"
                  placeholder="What kind of trips do you run? How many clients? What are you trying to solve?"
                />
              </div>

              {error && (
                <p className="text-sm text-[#C4423B]">{error}</p>
              )}

              <button
                onClick={handleSend}
                disabled={loading}
                className="mt-4 w-full rounded-full bg-[#2D5A3D] py-4 text-center text-sm font-semibold text-white transition-colors hover:bg-[#244B33] disabled:opacity-60"
              >
                {loading ? "Sending..." : "Send →"}
              </button>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
