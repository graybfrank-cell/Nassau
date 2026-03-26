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
        backgroundColor: "#F3EDE4",
        fontFamily: "'Helvetica Neue', Arial, sans-serif",
      }}
    >
      {/* HERO */}
      <section className="pt-32 pb-8 px-6 text-center max-w-xl mx-auto">
        <h1 className="text-6xl md:text-7xl font-black uppercase tracking-tighter text-[#18181B] leading-none mb-4">
          PICK YOUR PLAY.
        </h1>
        <p className="text-lg text-[#71717A] mb-8">
          Start free. Upgrade when you&apos;re ready.
        </p>

        {/* Pricing Toggle */}
        <div className="inline-flex bg-white p-1 rounded-lg shadow-sm border border-gray-200">
          <button
            onClick={() => setPlan("monthly")}
            className={`px-6 py-2 rounded-md font-black text-xs uppercase ${
              plan === "monthly"
                ? "bg-[#18181B] text-white"
                : "text-[#71717A] hover:text-[#18181B]"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setPlan("annual")}
            className={`px-6 py-2 rounded-md font-black text-xs uppercase flex items-center ${
              plan === "annual"
                ? "bg-[#18181B] text-white"
                : "text-[#71717A] hover:text-[#18181B]"
            }`}
          >
            Annual
            {plan !== "annual" && (
              <span className="bg-[#0D7377]/10 text-[#0D7377] px-2 py-0.5 rounded text-[9px] font-black tracking-tight ml-1">
                SAVE 40%
              </span>
            )}
          </button>
          <button
            onClick={() => setPlan("trip")}
            className={`px-6 py-2 rounded-md font-black text-xs uppercase ${
              plan === "trip"
                ? "bg-[#18181B] text-white"
                : "text-[#71717A] hover:text-[#18181B]"
            }`}
          >
            Trip
          </button>
          <button
            onClick={() => setPlan("founding")}
            className={`px-6 py-2 rounded-md font-black text-xs uppercase flex items-center ${
              plan === "founding"
                ? "bg-[#18181B] text-white"
                : "text-[#71717A] hover:text-[#18181B]"
            }`}
          >
            Founding
            {plan !== "founding" && (
              <span className="bg-[#C9A54E]/10 text-[#C9A54E] px-2 py-0.5 rounded text-[9px] font-black tracking-tight ml-1">
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
          <div className="bg-white rounded-2xl border-2 border-[#D94F2B] p-8 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-[#D94F2B] px-4 py-1.5 rounded-bl-xl">
              <span className="text-[10px] font-black tracking-widest text-white uppercase">
                ONE-TIME
              </span>
            </div>
            <p className="text-xs font-black uppercase tracking-widest text-[#D94F2B] mb-4">
              PER-TRIP PASS
            </p>
            <div className="flex items-baseline gap-1">
              <span className="text-5xl font-black text-[#18181B]">$9.99</span>
              <span className="text-[#71717A] text-sm">/ trip</span>
            </div>
            <p className="text-[#71717A] text-sm mt-2 mb-6">
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
                <li key={feat} className="flex items-center gap-3 text-[#18181B]">
                  <CheckCircle2 className="w-5 h-5 text-[#D94F2B] fill-[#D94F2B] shrink-0" />
                  {feat}
                </li>
              ))}
            </ul>
            <Link
              href="/login?redirect=/dashboard"
              className="block w-full py-4 rounded-lg bg-[#D94F2B] text-white font-black uppercase text-sm text-center hover:opacity-90 transition-opacity mt-8"
            >
              BUY A TRIP PASS
            </Link>
            <p className="text-center text-xs text-[#71717A] mt-3">
              Perfect for one-time groups. No commitment required.
            </p>
          </div>
        ) : plan !== "founding" ? (
          <>
            {/* COMMISSIONER */}
            <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
              <p className="text-xs font-black uppercase tracking-widest text-[#71717A] mb-4">
                COMMISSIONER
              </p>
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-black text-[#18181B]">$0</span>
                <span className="text-[#71717A] text-sm">/ forever</span>
              </div>
              <ul className="space-y-4 mt-6">
                {[
                  "Score any round solo or with friends",
                  "Basic skins tracking",
                  "Shareable round recap link",
                  "Unlimited rounds",
                ].map((feat) => (
                  <li key={feat} className="flex items-center gap-3 text-[#18181B]">
                    <CheckCircle2 className="w-5 h-5 text-[#71717A] shrink-0" />
                    {feat}
                  </li>
                ))}
              </ul>
              <Link
                href="/login?redirect=/dashboard"
                className="block w-full py-4 rounded-lg border-2 border-[#18181B] text-[#18181B] font-black uppercase text-sm text-center hover:bg-[#18181B] hover:text-white transition-colors mt-8"
              >
                GET STARTED FREE
              </Link>
            </div>

            {/* NASSAU PRO */}
            <div className="bg-white rounded-2xl border-2 border-[#D94F2B] p-8 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-[#C9A54E] px-4 py-1.5 rounded-bl-xl">
                <span className="text-[10px] font-black tracking-widest text-white uppercase">
                  MOST POPULAR
                </span>
              </div>
              <p className="text-xs font-black uppercase tracking-widest text-[#D94F2B] mb-4">
                NASSAU PRO
              </p>
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-black text-[#18181B]">
                  {plan === "monthly" ? "$6.99" : "$49.99"}
                </span>
                <span className="text-[#71717A] text-sm">
                  {plan === "monthly" ? "/ mo" : "/ yr"}
                </span>
                {plan === "annual" && (
                  <span className="text-[#71717A] text-sm line-through ml-2">
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
                  <li key={feat} className="flex items-center gap-3 text-[#18181B]">
                    <CheckCircle2 className="w-5 h-5 text-[#D94F2B] fill-[#D94F2B] shrink-0" />
                    {feat}
                  </li>
                ))}
              </ul>
              <Link
                href="/login?redirect=/dashboard"
                className="block w-full py-4 rounded-lg bg-[#D94F2B] text-white font-black uppercase text-sm text-center hover:opacity-90 transition-opacity mt-8"
              >
                START FREE TRIAL
              </Link>
              <p className="text-center text-xs text-[#71717A] mt-3">
                30-day free trial · No card required
              </p>
            </div>
          </>
        ) : (
          /* FOUNDING MEMBER */
          <div className="bg-[#18181B] rounded-2xl border-2 border-[#C9A54E] p-8 shadow-xl relative overflow-hidden max-w-xl mx-auto">
            <div className="absolute top-0 right-0 bg-[#C9A54E] px-4 py-1.5 rounded-bl-xl">
              <span className="text-[10px] font-black text-white uppercase">
                LIMITED · 47 SPOTS
              </span>
            </div>
            <p className="text-xs font-black uppercase tracking-widest text-[#C9A54E] mb-2">
              FOUNDING MEMBER
            </p>
            <div className="flex items-baseline gap-1">
              <span className="text-5xl font-black text-[#F3EDE4]">$49.99</span>
              <span className="text-[#F3EDE4]/60 text-sm">/ yr</span>
              <span className="text-[#F3EDE4]/40 text-sm line-through ml-2">
                $69.99
              </span>
            </div>
            <p className="text-[#F3EDE4]/60 text-sm mt-2 mb-6">
              Lock in this rate forever. Never increases.
            </p>

            {/* Progress bar */}
            <p className="text-[#F3EDE4]/40 text-xs mb-1">
              47 of 100 spots remaining
            </p>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#C9A54E] rounded-full"
                style={{ width: "53%" }}
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
                <li key={feat} className="flex items-center gap-3 text-[#F3EDE4]">
                  <CheckCircle2 className="w-5 h-5 text-[#C9A54E] shrink-0" />
                  {feat}
                </li>
              ))}
            </ul>
            <Link
              href="/login?redirect=/dashboard"
              className="block w-full py-4 rounded-lg bg-[#C9A54E] text-white font-black uppercase text-sm text-center hover:opacity-90 transition-opacity mt-8"
            >
              CLAIM FOUNDING SPOT — $49.99/YR
            </Link>
            <p className="text-center text-xs text-[#F3EDE4]/40 mt-3">
              Only 47 founding spots remaining. After April 1, this rate goes
              away forever.
            </p>
          </div>
        )}
      </section>

      {/* FAQ */}
      <section className="max-w-xl mx-auto px-6 mt-24">
        <h2 className="text-2xl font-black uppercase tracking-tighter text-[#18181B] mb-8">
          QUESTIONS?
        </h2>
        <div>
          {FAQ_ITEMS.map((item, i) => (
            <div key={i} className="border-t border-gray-200 py-6">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex justify-between items-center cursor-pointer"
              >
                <span className="font-black text-[#18181B] hover:text-[#D94F2B] transition-colors text-left">
                  {item.question}
                </span>
                <ChevronDown
                  className={`text-[#71717A] w-5 h-5 shrink-0 transition-transform ${
                    openFaq === i ? "rotate-180" : ""
                  }`}
                />
              </button>
              {openFaq === i && (
                <p className="text-[#71717A] text-sm pt-3">{item.answer}</p>
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
          <div className="absolute inset-0 bg-[#18181B]/70" />
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
            <p className="text-white font-black text-2xl mb-2">
              Elevate the game.
            </p>
            <p className="text-white/70 text-sm max-w-xs text-center">
              Built in Austin for golfers who take their weekends seriously.
            </p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#18181B] py-16 px-6 text-center">
        <p className="text-2xl font-black text-[#F3EDE4] mb-2">NASSAU</p>
        <p className="text-[#F3EDE4]/60 text-sm mb-8">
          Built by a golfer, for golfers.
        </p>
        <div className="flex justify-center gap-8">
          <span className="text-[#71717A] text-sm">Privacy</span>
          <span className="text-[#71717A] text-sm">Terms</span>
          <span className="text-[#71717A] text-sm">Support</span>
        </div>
        <p className="text-[#71717A] text-xs mt-4">
          © 2026 Nassau Golf. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
