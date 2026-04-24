"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ChevronRight, ChevronLeft, User, DollarSign, Target } from "lucide-react";

const TOTAL_STEPS = 3;

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-zinc-950">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-[#2D5A3D]" />
        </div>
      }
    >
      <OnboardingPageInner />
    </Suspense>
  );
}

function OnboardingPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const destinationParam = searchParams.get("destination");
  const [step, setStep] = useState(1);
  const [fullName, setFullName] = useState("");
  const [venmoUsername, setVenmoUsername] = useState("");
  const [handicap, setHandicap] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push("/login");
        return;
      }
      setCheckingAuth(false);
    });
  }, [router]);

  function handleNext() {
    setError("");

    if (step === 1) {
      if (!fullName.trim()) {
        setError("Please enter your name");
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!venmoUsername.trim()) {
        setError("Venmo username is required to settle bets");
        return;
      }
      setStep(3);
    } else if (step === 3) {
      handleComplete();
    }
  }

  function handleBack() {
    setError("");
    if (step > 1) setStep(step - 1);
  }

  async function handleComplete() {
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/onboarding/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          venmoUsername: venmoUsername.trim(),
          handicap: handicap ? parseFloat(handicap) : null,
        }),
      });

      if (!res.ok) {
        const data: { error?: string } = await res.json();
        setError(data.error || "Something went wrong");
        setSubmitting(false);
        return;
      }

      // Route into trip creation with destination pre-filled if user arrived
      // here via a destination-aware explore link. Otherwise, send new captains
      // to the three-path chooser — the dashboard is for returning users.
      if (destinationParam) {
        router.push(`/trips/create?destination=${encodeURIComponent(destinationParam)}`);
      } else {
        router.push("/trips/new");
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  if (checkingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-[#2D5A3D]" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-4">
      <div className="w-full max-w-md">
        {/* Progress indicator */}
        <div className="mb-8 flex items-center justify-center gap-2">
          {Array.from({ length: TOTAL_STEPS }, (_, i) => (
            <div
              key={i}
              className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                i + 1 === step
                  ? "bg-[#2D5A3D] text-white"
                  : i + 1 < step
                    ? "bg-emerald-600 text-white"
                    : "bg-zinc-800 text-zinc-500"
              }`}
            >
              {i + 1}
            </div>
          ))}
          <span className="ml-3 text-sm text-zinc-500">
            {step} of {TOTAL_STEPS}
          </span>
        </div>

        {/* Step content */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 sm:p-8">
          {step === 1 && (
            <StepName
              value={fullName}
              onChange={setFullName}
              onSubmit={handleNext}
            />
          )}

          {step === 2 && (
            <StepVenmo
              value={venmoUsername}
              onChange={setVenmoUsername}
              onSubmit={handleNext}
            />
          )}

          {step === 3 && (
            <StepHandicap
              value={handicap}
              onChange={setHandicap}
            />
          )}

          {/* Error */}
          {error && (
            <p className="mt-4 text-sm text-red-400">{error}</p>
          )}

          {/* Actions */}
          <div className="mt-6 flex items-center justify-between">
            {step > 1 ? (
              <button
                onClick={handleBack}
                className="flex items-center gap-1 text-sm font-medium text-zinc-400 transition-colors hover:text-zinc-200"
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </button>
            ) : (
              <div />
            )}

            {step < 3 ? (
              <button
                onClick={handleNext}
                className="flex items-center gap-1.5 rounded-lg bg-[#2D5A3D] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#244A32]"
              >
                Continue
                <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <div className="flex items-center gap-3">
                {!handicap && (
                  <button
                    onClick={handleComplete}
                    disabled={submitting}
                    className="text-sm font-medium text-zinc-400 transition-colors hover:text-zinc-200 disabled:opacity-50"
                  >
                    Skip
                  </button>
                )}
                <button
                  onClick={handleComplete}
                  disabled={submitting}
                  className="flex items-center gap-1.5 rounded-lg bg-[#2D5A3D] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#244A32] disabled:opacity-50"
                >
                  {submitting ? "Setting up..." : "Let's Go"}
                  {!submitting && <ChevronRight className="h-4 w-4" />}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step Components
// ---------------------------------------------------------------------------

function StepName({
  value,
  onChange,
  onSubmit,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
}) {
  return (
    <div>
      <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-800">
        <User className="h-5 w-5 text-[#2D5A3D]" />
      </div>
      <h2 className="mt-4 text-xl font-bold text-white">
        What&apos;s your name?
      </h2>
      <p className="mt-1 text-sm text-zinc-400">
        This is how your group will see you.
      </p>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && onSubmit()}
        placeholder="Full name"
        autoFocus
        className="mt-4 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none transition-colors focus:border-[#2D5A3D]"
      />
    </div>
  );
}

function StepVenmo({
  value,
  onChange,
  onSubmit,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
}) {
  return (
    <div>
      <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-800">
        <DollarSign className="h-5 w-5 text-[#2D5A3D]" />
      </div>
      <h2 className="mt-4 text-xl font-bold text-white">
        Add your Venmo @username
      </h2>
      <p className="mt-1 text-sm text-zinc-400">
        Your group needs this to pay you after rounds.
      </p>
      <div className="mt-4 flex items-center gap-2">
        <span className="text-sm font-medium text-zinc-500">@</span>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSubmit()}
          placeholder="username"
          autoFocus
          className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none transition-colors focus:border-[#2D5A3D]"
        />
      </div>
      <p className="mt-3 text-xs text-zinc-500">
        Required to settle bets with your group.
      </p>
    </div>
  );
}

function StepHandicap({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-800">
        <Target className="h-5 w-5 text-[#2D5A3D]" />
      </div>
      <h2 className="mt-4 text-xl font-bold text-white">
        What&apos;s your handicap?
      </h2>
      <p className="mt-1 text-sm text-zinc-400">
        Optional — you can always add this later.
      </p>
      <input
        type="number"
        step="0.1"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="e.g. 12.4"
        autoFocus
        className="mt-4 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none transition-colors focus:border-[#2D5A3D]"
      />
    </div>
  );
}
