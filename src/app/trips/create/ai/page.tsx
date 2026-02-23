"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function AITripPlanningPage() {
  return (
    <div className="min-h-[calc(100vh-64px)] bg-zinc-50 px-6 py-10">
      <div className="mx-auto max-w-2xl text-center">
        <Link
          href="/trips/new"
          className="inline-flex items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-zinc-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>

        <div className="mt-16">
          <span className="text-6xl">{"\uD83E\uDD16"}</span>
          <h1 className="mt-6 text-2xl font-bold tracking-tight text-zinc-900">
            AI Trip Planning
          </h1>
          <p className="mt-3 text-zinc-500">
            Coming Soon. Check back after April 1.
          </p>
          <p className="mt-2 text-sm text-zinc-400">
            Tell us your vibe, budget, and group size and we&apos;ll plan the
            perfect golf trip for you.
          </p>
          <Link
            href="/trips/new"
            className="mt-8 inline-flex rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
          >
            Go Back
          </Link>
        </div>
      </div>
    </div>
  );
}
