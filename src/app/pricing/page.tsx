"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Check, Sparkles } from "lucide-react";

interface Plan {
  id: string;
  name: string;
  price: string;
  period: string | null;
  description: string;
  cta: string;
  badge?: string | null;
  features: string[];
  stripePlan: string | null; // maps to server-side PRICE_MAP key
}

const PLANS: Plan[] = [
  {
    id: "free",
    name: "One-Time Trial Trip",
    price: "Free",
    period: null,
    description: "Try Nassau with one full trip — no card required.",
    cta: "Start Free",
    features: [
      "1 trip with full features",
      "Scorecards & skins",
      "Expense splitting",
      "AI trip planning",
    ],
    stripePlan: null,
  },
  {
    id: "monthly",
    name: "Pro Monthly",
    price: "$6.99",
    period: "/month",
    description: "Unlimited trips with a 30-day free trial.",
    cta: "Start Free Trial",
    badge: null,
    features: [
      "Unlimited trips & rounds",
      "30-day free trial",
      "All bet types",
      "Priority support",
    ],
    stripePlan: "monthly",
  },
  {
    id: "annual",
    name: "Pro Annual",
    price: "$49.99",
    period: "/year",
    description: "Best value — save over 40% vs monthly.",
    cta: "Get Pro Annual",
    badge: "Best Value",
    features: [
      "Everything in Pro Monthly",
      "Save over 40%",
      "All bet types",
      "Priority support",
    ],
    stripePlan: "annual",
  },
  {
    id: "trip-pass",
    name: "Per-Trip Pass",
    price: "$4.99",
    period: "one-time",
    description: "Pay per trip — no commitment.",
    cta: "Buy Trip Pass",
    features: [
      "1 additional trip",
      "Full features for that trip",
      "Scorecards & skins",
      "Expense splitting",
    ],
    stripePlan: null,
  },
];

export default function PricingPage() {
  const router = useRouter();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  async function handleCheckout(plan: Plan) {
    if (plan.id === "free") {
      router.push("/dashboard");
      return;
    }

    setLoadingPlan(plan.id);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const res = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: plan.stripePlan,
          userId: user.id,
          email: user.email,
        }),
      });

      const { url, error } = await res.json();
      if (error) throw new Error(error);
      if (url) window.location.href = url;
    } catch (err) {
      console.error("[pricing]", err);
      setLoadingPlan(null);
    }
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-zinc-950 px-6 py-16">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-[#F3EDE4] sm:text-4xl">
            Simple, Honest Pricing
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-base text-zinc-400">
            Start free, upgrade when you&apos;re ready. Every plan includes the
            full Nassau experience.
          </p>
        </div>

        {/* Plan cards */}
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {PLANS.map((plan) => {
            const isAnnual = plan.id === "annual";
            return (
              <div
                key={plan.id}
                className={`relative flex flex-col rounded-2xl border p-6 transition-colors ${
                  isAnnual
                    ? "border-[#D94F2B] bg-zinc-900"
                    : "border-zinc-800 bg-zinc-900 hover:border-zinc-700"
                }`}
              >
                {/* Badge */}
                {plan.badge && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 rounded-full bg-[#D94F2B] px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
                    <Sparkles className="h-3 w-3" />
                    {plan.badge}
                  </span>
                )}

                <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">
                  {plan.name}
                </h3>

                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-[#F3EDE4]">
                    {plan.price}
                  </span>
                  {plan.period && (
                    <span className="text-sm text-zinc-500">{plan.period}</span>
                  )}
                </div>

                <p className="mt-2 text-sm text-zinc-400">{plan.description}</p>

                <ul className="mt-6 flex-1 space-y-2.5">
                  {plan.features.map((feat) => (
                    <li
                      key={feat}
                      className="flex items-start gap-2 text-sm text-zinc-300"
                    >
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#D94F2B]" />
                      {feat}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleCheckout(plan)}
                  disabled={loadingPlan === plan.id}
                  className={`mt-6 w-full rounded-lg py-2.5 text-sm font-semibold transition-colors disabled:opacity-60 ${
                    isAnnual
                      ? "bg-[#D94F2B] text-white hover:bg-[#B83D25]"
                      : plan.id === "free"
                        ? "border border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                        : "bg-zinc-800 text-[#F3EDE4] hover:bg-zinc-700"
                  }`}
                >
                  {loadingPlan === plan.id ? "Redirecting..." : plan.cta}
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer note */}
        <p className="mt-10 text-center text-xs text-zinc-500">
          All paid plans are billed via Stripe. Cancel anytime from your
          dashboard.
        </p>
      </div>
    </div>
  );
}
