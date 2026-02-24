"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const paths = [
  {
    emoji: "\uD83D\uDCCB",
    title: "I Have a Plan",
    description: "I know where we're going. Let me set it up.",
    href: "/trips/create",
    available: true,
  },
  {
    emoji: "\uD83E\uDD16",
    title: "Help Me Figure It Out",
    description: "Not sure where to go? Answer a few questions and our AI will plan the perfect trip.",
    href: "/trips/create/ai",
    available: true,
  },
  {
    emoji: "\uD83D\uDD0D",
    title: "Browse Trips",
    description: "Explore pre-built trip templates from top destinations.",
    href: "/explore",
    available: false,
  },
];

export default function NewTripPage() {
  return (
    <div className="min-h-[calc(100vh-64px)] bg-zinc-50 px-6 py-10">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-zinc-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        <div className="mt-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
            Plan Your Trip
          </h1>
          <p className="mt-2 text-zinc-500">
            How would you like to get started?
          </p>
        </div>

        <div className="mt-10 space-y-4">
          {paths.map((path) => (
            <Link
              key={path.title}
              href={path.href}
              className="group relative block rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition-all hover:border-emerald-300 hover:shadow-md"
            >
              {!path.available && (
                <span className="absolute right-4 top-4 rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-500">
                  Coming Soon
                </span>
              )}
              <div className="flex items-start gap-4">
                <span className="text-4xl">{path.emoji}</span>
                <div>
                  <h2 className="text-lg font-semibold text-zinc-900 group-hover:text-emerald-700">
                    {path.title}
                  </h2>
                  <p className="mt-1 text-sm text-zinc-500">
                    {path.description}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
