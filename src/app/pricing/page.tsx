"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { CheckCircle2, ChevronDown } from "lucide-react";

const FAQ_ITEMS = [
  {
    question: "Is there a subscription?",
    answer:
      "Only if you want one. Per-Trip Pass is $9.99 one-time for a single trip. Founding Member is $49.99/year for the first 100 captains who want unlimited trips and a lifetime price lock. That's it — no middle tiers, no hidden plans.",
  },
  {
    question: "Can I use Nassau for just one trip?",
    answer:
      "Yes. Per-Trip Pass gets you full coordination features for one trip — one invite link, live dashboard, scorecards, settlements, recap. $9.99. No subscription, no expiration on that trip.",
  },
  {
    question: "What happens after my trial ends?",
    answer:
      "You drop to the free Commissioner tier automatically. No charges, no surprises. Upgrade again anytime.",
  },
];

export default function PricingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: "#F2F0EB",
      }}
    >
      {/* HERO */}
      <section className="pt-32 pb-16 px-6 text-center max-w-3xl mx-auto">
        <h1 className="font-headline text-6xl md:text-7xl font-medium tracking-tighter text-[#111111] leading-none">
          Pick Your Play.
        </h1>
      </section>

      {/* PRICING CARDS */}
      <section className="px-6 lg:px-16">
        <div className="mx-auto max-w-4xl grid gap-8 md:grid-cols-2">
          {/* CARD 1 — PER-TRIP PASS */}
          <div className="flex flex-col rounded-2xl border border-[#111111]/10 bg-[#F2F0EB] p-10 shadow-sm">
            <div className="flex items-baseline gap-2">
              <span className="font-headline text-5xl font-medium text-[#111111]">
                $9.99
              </span>
              <span className="text-sm text-[#8A8A8A]">one trip</span>
            </div>
            <p className="mt-4 text-sm font-medium text-[#111111]">
              Full Nassau features. One trip. No subscription.
            </p>
            <p className="mt-2 text-sm text-[#8A8A8A]">
              Build your trip free. Pay when you&apos;re ready to send it to
              the group.
            </p>
            <ul className="mt-6 space-y-3">
              <li className="flex items-start gap-3 text-sm text-[#111111]">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#2D5A3D]" />
                One link to invite your whole group
              </li>
              <li className="flex items-start gap-3 text-sm text-[#111111]">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#2D5A3D]" />
                Live coordination: date poll, itinerary, deposits
              </li>
              <li className="flex items-start gap-3 text-sm text-[#111111]">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#2D5A3D]" />
                Scores, settlements, and recap
              </li>
            </ul>
            <Link
              href="/login?next=/trips/new"
              className="mt-auto block w-full rounded-full bg-[#2D5A3D] py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-[#244B33]"
              style={{ marginTop: "2.5rem" }}
            >
              Plan a trip →
            </Link>
          </div>

          {/* CARD 2 — FOUNDING MEMBER */}
          <div className="flex flex-col rounded-2xl bg-[#111111] p-10 shadow-sm">
            <div className="flex items-baseline gap-2">
              <span className="font-headline text-5xl font-medium text-[#F2F0EB]">
                $49.99
              </span>
              <span className="text-sm text-[#F2F0EB]/70">/ year, forever</span>
            </div>
            <p className="mt-4 text-sm font-medium text-[#C9A54E]">
              First 100 captains only.
            </p>
            <p className="mt-2 text-xs italic text-[#F2F0EB]/70">
              For personal use organizing trips with your own friends and
              group.
            </p>

            <div className="mt-6">
              <p className="mb-2 text-xs text-[#F2F0EB]/70">
                12 of 100 claimed
              </p>
              <div className="h-1.5 overflow-hidden rounded-full bg-[#F2F0EB]/10">
                <div
                  className="h-full rounded-full bg-[#C9A54E]"
                  style={{ width: "12%" }}
                />
              </div>
            </div>

            <ul className="mt-6 space-y-3">
              <li className="flex items-start gap-3 text-sm text-[#F2F0EB]">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#C9A54E]" />
                Unlimited trips, forever
              </li>
              <li className="flex items-start gap-3 text-sm text-[#F2F0EB]">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#C9A54E]" />
                Lifetime price lock at $49.99/year
              </li>
              <li className="flex items-start gap-3 text-sm text-[#F2F0EB]">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#C9A54E]" />
                Founding Member badge on your profile
              </li>
              <li className="flex items-start gap-3 text-sm text-[#F2F0EB]">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#C9A54E]" />
                First access to the Nassau marketplace when it launches
              </li>
              <li className="flex items-start gap-3 text-sm text-[#F2F0EB]">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#C9A54E]" />
                Direct founder access
              </li>
            </ul>
            <Link
              href="/founding"
              className="mt-auto block w-full rounded-full bg-[#C9A54E] py-3 text-center text-sm font-semibold text-[#111111] transition-opacity hover:opacity-90"
              style={{ marginTop: "2.5rem" }}
            >
              Join the 100 →
            </Link>
          </div>
        </div>

        {/* PARTNERSHIPS ROW */}
        <div className="mx-auto mt-20 max-w-4xl">
          <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#8A8A8A]">
            Partnerships
          </p>
          <h3 className="mt-3 font-headline text-[28px] font-medium leading-tight tracking-tight text-[#111111] sm:text-[32px]">
            Running trips commercially?
          </h3>
          <p className="mt-3 max-w-2xl text-base text-[#111111]/70">
            Agencies, creators, concierges, and resort teams use Nassau as
            their operating layer.
          </p>
          <Link
            href="/partnerships"
            className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[#2D5A3D] hover:text-[#244B33]"
          >
            Talk to us →
          </Link>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-xl mx-auto px-6 mt-24">
        <h2 className="font-headline text-[28px] font-medium tracking-tight text-[#111111] mb-8">
          Questions?
        </h2>
        <div>
          {FAQ_ITEMS.map((item, i) => (
            <div key={i} className="border-t border-gray-200 py-6">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex justify-between items-center cursor-pointer"
              >
                <span className="font-medium text-[#111111] hover:text-[#2D5A3D] transition-colors text-left">
                  {item.question}
                </span>
                <ChevronDown
                  className={`text-[#8A8A8A] w-5 h-5 shrink-0 transition-transform ${
                    openFaq === i ? "rotate-180" : ""
                  }`}
                />
              </button>
              {openFaq === i && (
                <p className="text-[#8A8A8A] text-sm pt-3">{item.answer}</p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* SOCIAL PROOF BANNER */}
      <section className="max-w-xl mx-auto px-6 mt-20 mb-20">
        <div className="rounded-2xl overflow-hidden aspect-video relative">
          <Image
            src="https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=800"
            alt="Golf course"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-[#111111]/80" />
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
            <p className="text-white font-headline text-2xl font-medium mb-2">
              Elevate the game.
            </p>
            <p className="text-white/70 text-sm max-w-xs text-center">
              Built in Austin for golfers who take their weekends seriously.
            </p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#111111] py-16 px-6 text-center">
        <p className="font-headline text-[32px] font-medium text-[#F2F0EB] mb-2">Nassau</p>
        <p className="text-[#F2F0EB]/60 text-sm mb-8">
          Built by a golfer, for golfers.
        </p>
        <div className="flex justify-center gap-8">
          <span className="text-[#8A8A8A] text-sm">Privacy</span>
          <span className="text-[#8A8A8A] text-sm">Terms</span>
          <span className="text-[#8A8A8A] text-sm">Support</span>
        </div>
        <p className="text-[#8A8A8A] text-xs mt-4">
          © 2026 Nassau Golf. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
