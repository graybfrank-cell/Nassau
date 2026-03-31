"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { CheckCircle2, ChevronDown } from "lucide-react";

type PlanType = "monthly" | "annual" | "trip" | "founding";

const FAQ_ITEMS = [
  {
    question: "Is there really no credit card required?",
    answer:
      "No credit card required to start. Just your email. We only ask for payment when you upgrade to Pro.",
  },
  {
    question: "Can I use Nassau for just one trip?",
    answer:
      "Yes — grab a Per-Trip Pass for $9.99. One trip, full Pro features, no subscription needed.",
  },
  {
    question: "What happens after my trial ends?",
    answer:
      "You drop to the free Commissioner tier automatically. No charges, no surprises. Upgrade again anytime.",
  },
];

export default function PricingPage() {
  const [plan, setPlan] = useState<PlanType>("monthly");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: "#F2F0EB",
      }}
    >
      {/* HERO */}
      <section className="pt-32 pb-8 px-6 text-center max-w-xl mx-auto">
        <h1 className="font-headline text-6xl md:text-7xl font-medium tracking-tighter text-[#111111] leading-none mb-4">
          Pick Your Play.
        </h1>
        <p className="text-lg text-[#8A8A8A] mb-8">
          Start free. Upgrade when you&apos;re ready.
        </p>

        {/* Pricing Toggle */}
        <div className="inline-flex bg-white p-1 rounded-lg shadow-sm border border-gray-200">
          <button
            onClick={() => setPlan("monthly")}
            className={`px-6 py-2 rounded-md font-semibold text-xs uppercase ${
              plan === "monthly"
                ? "bg-[#111111] text-white"
                : "text-[#8A8A8A] hover:text-[#111111]"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setPlan("annual")}
            className={`px-6 py-2 rounded-md font-semibold text-xs uppercase flex items-center ${
              plan === "annual"
                ? "bg-[#111111] text-white"
                : "text-[#8A8A8A] hover:text-[#111111]"
            }`}
          >
            Annual
            {plan !== "annual" && (
              <span className="bg-[#2D5A3D]/10 text-[#2D5A3D] px-2 py-0.5 rounded text-[9px] font-semibold tracking-tight ml-1">
                SAVE 40%
              </span>
            )}
          </button>
          <button
            onClick={() => setPlan("trip")}
            className={`px-6 py-2 rounded-md font-semibold text-xs uppercase ${
              plan === "trip"
                ? "bg-[#111111] text-white"
                : "text-[#8A8A8A] hover:text-[#111111]"
            }`}
          >
            Trip
          </button>
          <button
            onClick={() => setPlan("founding")}
            className={`px-6 py-2 rounded-md font-semibold text-xs uppercase flex items-center ${
              plan === "founding"
                ? "bg-[#111111] text-white"
                : "text-[#8A8A8A] hover:text-[#111111]"
            }`}
          >
            Founding
            {plan !== "founding" && (
              <span className="bg-[#B8976A]/10 text-[#B8976A] px-2 py-0.5 rounded text-[9px] font-semibold tracking-tight ml-1">
                LIMITED
              </span>
            )}
          </button>
        </div>
      </section>

      {/* PRICING CARDS */}
      <section className="max-w-xl mx-auto px-6 space-y-6">
        {plan === "trip" ? (
          /* PER-TRIP PASS */
          <div className="bg-white rounded-2xl p-8 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-[#2D5A3D] px-4 py-1.5 rounded-bl-xl">
              <span className="text-[10px] font-semibold tracking-widest text-white uppercase">
                ONE-TIME
              </span>
            </div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#2D5A3D] mb-4">
              PER-TRIP PASS
            </p>
            <div className="flex items-baseline gap-1">
              <span className="text-5xl font-semibold text-[#111111]">$9.99</span>
              <span className="text-[#8A8A8A] text-sm">/ trip</span>
            </div>
            <p className="text-[#8A8A8A] text-sm mt-2 mb-6">
              One trip. Full Pro features. No subscription.
            </p>
            <ul className="space-y-4">
              {[
                "Full trip planning + itinerary",
                "Nassau bet + skins settlements",
                "Expense tracking + splits",
                "Shareable trip invite page",
                "Round scoring for all players",
              ].map((feat) => (
                <li key={feat} className="flex items-center gap-3 text-[#111111]">
                  <CheckCircle2 className="w-5 h-5 text-[#2D5A3D] fill-[#2D5A3D] shrink-0" />
                  {feat}
                </li>
              ))}
            </ul>
            <Link
              href="/login?redirect=/dashboard"
              className="block w-full py-4 rounded-lg bg-[#2D5A3D] text-white font-semibold uppercase text-sm text-center hover:opacity-90 transition-opacity mt-8"
            >
              BUY A TRIP PASS
            </Link>
            <p className="text-center text-xs text-[#8A8A8A] mt-3">
              Perfect for one-time groups. No commitment required.
            </p>
          </div>
        ) : plan !== "founding" ? (
          <>
            {/* COMMISSIONER */}
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#8A8A8A] mb-4">
                COMMISSIONER
              </p>
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-semibold text-[#111111]">$0</span>
                <span className="text-[#8A8A8A] text-sm">/ forever</span>
              </div>
              <ul className="space-y-4 mt-6">
                {[
                  "Score any round solo or with friends",
                  "Basic skins tracking",
                  "Shareable round recap link",
                  "Unlimited rounds",
                ].map((feat) => (
                  <li key={feat} className="flex items-center gap-3 text-[#111111]">
                    <CheckCircle2 className="w-5 h-5 text-[#8A8A8A] shrink-0" />
                    {feat}
                  </li>
                ))}
              </ul>
              <Link
                href="/login?redirect=/dashboard"
                className="block w-full py-4 rounded-lg border-2 border-[#111111] text-[#111111] font-semibold uppercase text-sm text-center hover:bg-[#111111] hover:text-white transition-colors mt-8"
              >
                GET STARTED FREE
              </Link>
            </div>

            {/* NASSAU PRO */}
            <div className="bg-white rounded-2xl p-8 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-[#2D5A3D] px-4 py-1.5 rounded-bl-xl">
                <span className="text-[10px] font-semibold tracking-widest text-white uppercase">
                  MOST POPULAR
                </span>
              </div>
              <p className="text-xs font-semibold uppercase tracking-widest text-[#2D5A3D] mb-4">
                NASSAU PRO
              </p>
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-semibold text-[#111111]">
                  {plan === "monthly" ? "$6.99" : "$49.99"}
                </span>
                <span className="text-[#8A8A8A] text-sm">
                  {plan === "monthly" ? "/ mo" : "/ yr"}
                </span>
                {plan === "annual" && (
                  <span className="text-[#8A8A8A] text-sm line-through ml-2">
                    $69.99
                  </span>
                )}
              </div>
              <ul className="space-y-4 mt-6">
                {[
                  "Everything in Commissioner",
                  "Full trip planning + itinerary",
                  "Nassau bet + skins settlements",
                  "Expense tracking + splits",
                ].map((feat) => (
                  <li key={feat} className="flex items-center gap-3 text-[#111111]">
                    <CheckCircle2 className="w-5 h-5 text-[#2D5A3D] fill-[#2D5A3D] shrink-0" />
                    {feat}
                  </li>
                ))}
              </ul>
              <Link
                href="/login?redirect=/dashboard"
                className="block w-full py-4 rounded-lg bg-[#2D5A3D] text-white font-semibold uppercase text-sm text-center hover:opacity-90 transition-opacity mt-8"
              >
                START FREE TRIAL
              </Link>
              <p className="text-center text-xs text-[#8A8A8A] mt-3">
                30-day free trial · No card required
              </p>
            </div>
          </>
        ) : (
          /* FOUNDING MEMBER */
          <div className="bg-[#111111] rounded-2xl border-2 border-[#B8976A] p-8 shadow-xl relative overflow-hidden max-w-xl mx-auto">
            <div className="absolute top-0 right-0 bg-[#B8976A] px-4 py-1.5 rounded-bl-xl">
              <span className="text-[10px] font-semibold text-white uppercase">
                LIMITED · 88 SPOTS
              </span>
            </div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#B8976A] mb-2">
              FOUNDING MEMBER
            </p>
            <div className="flex items-baseline gap-1">
              <span className="text-5xl font-semibold text-[#F2F0EB]">$49.99</span>
              <span className="text-[#F2F0EB]/60 text-sm">/ yr</span>
              <span className="text-[#F2F0EB]/40 text-sm line-through ml-2">
                $69.99
              </span>
            </div>
            <p className="text-[#F2F0EB]/60 text-sm mt-2 mb-6">
              Lock in this rate forever. Never increases.
            </p>

            {/* Progress bar */}
            <p className="text-[#F2F0EB]/40 text-xs mb-1">
              88 of 100 spots remaining
            </p>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#B8976A] rounded-full"
                style={{ width: "12%" }}
              />
            </div>

            <ul className="space-y-4 mt-6">
              {[
                "Everything in Nassau Pro",
                "Founding Member badge on your profile",
                "Rate locked in forever — never increases",
                "Priority support + early feature access",
                "30-day free trial included",
              ].map((feat) => (
                <li key={feat} className="flex items-center gap-3 text-[#F2F0EB]">
                  <CheckCircle2 className="w-5 h-5 text-[#B8976A] shrink-0" />
                  {feat}
                </li>
              ))}
            </ul>
            <Link
              href="/login?redirect=/dashboard"
              className="block w-full py-4 rounded-lg bg-[#B8976A] text-white font-semibold uppercase text-sm text-center hover:opacity-90 transition-opacity mt-8"
            >
              CLAIM FOUNDING SPOT — $49.99/YR
            </Link>
            <p className="text-center text-xs text-[#F2F0EB]/40 mt-3">
              Only 88 founding spots remaining. After April 1, this rate goes
              away forever.
            </p>
          </div>
        )}
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
