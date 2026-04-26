"use client";

import { useState } from "react";
import { X } from "lucide-react";

type PaywallModalProps = {
  isOpen: boolean;
  onClose: () => void;
  tripId: string;
  tripName: string;
  destination?: string;
};

export default function PaywallModal({ isOpen, onClose, tripId, tripName, destination }: PaywallModalProps) {
  const [loading, setLoading] = useState<"trip" | "founding" | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCheckout = async (mode: "trip" | "founding") => {
    setLoading(mode);
    setError(null);
    try {
      const res = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mode === "trip" ? { mode: "trip", tripId } : { mode: "founding" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Checkout failed");
      if (data.url) window.location.href = data.url;
    } catch (e: any) {
      setError(e.message || "Something went wrong");
      setLoading(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="relative w-full max-w-md rounded-2xl bg-[#F2F0EB] p-8 shadow-xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-[#8A8A8A] hover:text-[#111111]"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        <div className="mb-2 text-[11px] font-medium uppercase tracking-[0.12em] text-[#8A8A8A]">
          READY TO SEND IT
        </div>
        <h2 className="mb-3 font-serif text-3xl text-[#111111]">
          Time to make {tripName} real.
        </h2>
        <p className="mb-6 text-[15px] leading-relaxed text-[#111111]/70">
          Lock in your trip and send it to the group. One link, full coordination — date poll, itinerary, scorecards, settlements, recap.
        </p>

        {/* Per-Trip Pass — primary */}
        <button
          onClick={() => handleCheckout("trip")}
          disabled={loading !== null}
          className="mb-3 flex w-full items-center justify-between rounded-xl bg-[#2D5A3D] px-5 py-4 text-left text-white transition hover:bg-[#244a31] disabled:opacity-50"
        >
          <div>
            <div className="font-semibold">Send this trip — $9.99</div>
            <div className="text-[13px] text-white/70">One-time, just this trip</div>
          </div>
          <span className="text-xl">→</span>
        </button>

        {/* Founding Member — secondary */}
        <button
          onClick={() => handleCheckout("founding")}
          disabled={loading !== null}
          className="mb-4 flex w-full items-center justify-between rounded-xl border border-[#C9A54E] bg-transparent px-5 py-4 text-left text-[#111111] transition hover:bg-[#C9A54E]/10 disabled:opacity-50"
        >
          <div>
            <div className="font-semibold">Or join the 100 — $49.99/year</div>
            <div className="text-[13px] text-[#111111]/60">Unlimited trips, lifetime price lock</div>
          </div>
          <span className="text-xl">→</span>
        </button>

        {error && (
          <div className="mb-3 rounded-lg bg-red-50 px-4 py-2 text-[13px] text-red-700">
            {error}
          </div>
        )}

        {loading && (
          <div className="text-center text-[13px] text-[#8A8A8A]">
            Opening checkout…
          </div>
        )}

        <p className="mt-4 text-center text-[12px] leading-relaxed text-[#111111]/50">
          No subscription required. Captain pays once. Group plays for free.
        </p>
      </div>
    </div>
  );
}
