"use client";

import { useState } from "react";
import { redirectToKitCheckout } from "@/lib/checkout-kit";
import type { Destination } from "@/lib/destination-utils";

type Variant = "hero" | "bridge" | "cta";

type Props = {
  dest: Destination;
  variant: Variant;
  /** Optional override for the button label (defaults vary by variant) */
  label?: string;
};

/**
 * The single source of truth for "Buy this kit" buttons across the preview page.
 * Renders style-appropriate button for each context (Hero, UnlockBridge, FinalCTA)
 * and handles the checkout redirect, loading state, and error display.
 */
export default function BuyKitButton({ dest, variant, label }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const defaultLabel = (() => {
    if (variant === "hero") return "Buy this trip for $29 \u2192";
    if (variant === "bridge") return "Unlock the rest for $29 \u2192";
    return "Buy this trip for $29 \u2192"; // cta
  })();

  const handleClick = async () => {
    if (isLoading) return;
    setError(null);
    setIsLoading(true);
    try {
      await redirectToKitCheckout(dest.id);
      // On success, the browser is being redirected — no need to setIsLoading(false)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Couldn't start checkout";
      setError(message);
      setIsLoading(false);
    }
  };

  // Style classes per variant — match the surrounding section's design
  const classByVariant: Record<Variant, string> = {
    hero:
      "inline-block rounded-full bg-[#2D5A3D] px-12 py-5 text-base font-medium text-white shadow-lg shadow-black/40 transition-all duration-200 hover:scale-[1.02] hover:bg-[#244B33] disabled:cursor-not-allowed disabled:opacity-60",
    bridge:
      "inline-block rounded-full bg-[#2D5A3D] px-8 py-3.5 text-sm font-medium text-white transition-colors duration-200 hover:bg-[#244B33] disabled:cursor-not-allowed disabled:opacity-60",
    cta:
      "inline-block rounded-full bg-[#2D5A3D] px-10 py-4 text-base font-medium text-white transition-colors duration-200 hover:bg-[#244B33] disabled:cursor-not-allowed disabled:opacity-60",
  };

  return (
    <div className="inline-flex flex-col items-center">
      <button
        type="button"
        onClick={handleClick}
        disabled={isLoading}
        className={classByVariant[variant]}
        aria-busy={isLoading}
      >
        {isLoading ? "Opening checkout..." : (label ?? defaultLabel)}
      </button>

      {error && (
        <p className="mt-3 max-w-xs text-center text-[12px] text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}
