import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Flag, Map, Wallet, CheckCircle2, Search, Users, Gamepad2, CreditCard } from "lucide-react";
import AuthRedirect from "./auth-redirect";
import { createServiceClient } from "@/lib/supabase/admin";

export const metadata: Metadata = {
  title: "Nassau — Your Golf Trip, Handled.",
  description:
    "Nassau is the operating system for golf trips. Plan trips, coordinate your crew, track rounds, and settle bets — all in one app.",
  openGraph: {
    title: "Nassau — Your Golf Trip, Handled.",
    description: "The operating system for golf trips.",
    images: [
      "/api/og/default?title=Plan%20Trips.%0ATrack%20Rounds.%0ASettle%20Bets.&subtitle=The%20app%20for%20groups%20who%20actually%20play.",
    ],
  },
};

/* ─── Sample data for live scorecard demo ─── */

const sampleScorecard: {
  name: string;
  front: number;
  back: number;
  total: number;
  skins: number;
  money: string;
}[] = [
  { name: "Grayson", front: 38, back: 41, total: 79, skins: 3, money: "+$45" },
  { name: "Tyler", front: 42, back: 39, total: 81, skins: 2, money: "+$15" },
  { name: "Jake", front: 44, back: 43, total: 87, skins: 1, money: "-$20" },
  { name: "Marcus", front: 40, back: 45, total: 85, skins: 0, money: "-$40" },
];

/* ─── Explore destination cards data ─── */

const exploreDestinations = [
  { name: "Scottsdale, AZ", price: "from $1,650", vibes: ["Resort", "Party"], info: "3N · 3 rounds", id: "scottsdale-az" },
  { name: "Bandon Dunes, OR", price: "from $3,200", vibes: ["Bucket List", "Competitive"], info: "3N · 4 rounds", id: "bandon-dunes-or" },
  { name: "Pinehurst, NC", price: "from $2,200", vibes: ["Bucket List", "Competitive"], info: "3N · 3 rounds", id: "pinehurst-nc" },
  { name: "Myrtle Beach, SC", price: "from $850", vibes: ["Budget", "Party"], info: "3N · 4 rounds", id: "myrtle-beach-sc" },
  { name: "Pebble Beach, CA", price: "from $3,500", vibes: ["Bucket List", "Scenic"], info: "3N · 3 rounds", id: "pebble-beach-monterey-ca" },
  { name: "St. Andrews, Scotland", price: "from $5,000", vibes: ["Bucket List", "Competitive"], info: "4N · 3 rounds", id: "st-andrews-scotland" },
];

/* ─── RecentArticles (preserved) ─── */

async function RecentArticles() {
  const supabase = createServiceClient();
  const { data: posts } = await supabase
    .from("seo_blog_posts")
    .select(
      "id, title, slug, meta_description, featured_image_url, reading_time_minutes, word_count, tags, published_at"
    )
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(3);

  if (!posts || posts.length === 0) {
    return (
      <p className="py-8 text-center text-[#8A8A8A]">Articles coming soon.</p>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {posts.map((post) => (
        <Link
          key={post.id}
          href={`/blog/${post.slug}`}
          className="group overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-md"
        >
          {post.featured_image_url ? (
            <div className="aspect-video overflow-hidden bg-gray-100">
              <img
                src={post.featured_image_url}
                alt={post.title}
                className="h-full w-full object-cover transition-transform group-hover:scale-105"
              />
            </div>
          ) : (
            <div className="flex aspect-video items-center justify-center bg-[#111111]">
              <span className="text-4xl font-semibold text-[#2D5A3D]/20">N</span>
            </div>
          )}
          <div className="p-5">
            {post.tags?.[0] && (
              <span className="rounded-full bg-[#2D5A3D]/10 px-2.5 py-0.5 text-xs font-medium text-[#2D5A3D]">
                {post.tags[0]}
              </span>
            )}
            <h3 className="mt-2 font-semibold text-[#111111] transition-colors group-hover:text-[#2D5A3D] line-clamp-2">
              {post.title}
            </h3>
            <p className="mt-1 text-sm text-[#8A8A8A] line-clamp-2">
              {post.meta_description}
            </p>
            <div className="mt-3 text-xs text-[#8A8A8A]">
              {post.reading_time_minutes ||
                Math.ceil((post.word_count || 0) / 200)}{" "}
              min read
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

/* ─── Home Page ─── */

export default async function Home() {
  return (
    <div className="relative">
      <AuthRedirect />

      {/* ═══ SECTION 1 — HERO ═══ */}
      <section className="relative flex min-h-screen flex-col justify-end overflow-hidden pb-24 px-6 lg:px-16">
        {/* Background image */}
        <Image
          src="https://images.unsplash.com/photo-1592919355415-9db1cd94b2ba?q=80&w=2232&auto=format&fit=crop"
          alt="Golf course at dawn"
          fill
          priority
          className="object-cover"
        />
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#111111] via-[#111111]/50 to-transparent" />

        {/* Content */}
        <div className="relative z-10 max-w-6xl">
          <h1 className="font-headline text-6xl font-medium leading-none tracking-tighter text-[#F2F0EB] md:text-8xl lg:text-[120px]">
            Your Golf Trip,
          </h1>
          <h1 className="font-headline text-6xl font-medium leading-none tracking-tighter text-[#2D5A3D] md:text-8xl lg:text-[120px]">
            Handled.
          </h1>
          <p className="mt-4 max-w-lg text-lg text-[#F2F0EB]/70">
            The operating system for golf trips. From the first group text to the last settlement &mdash; one app.
          </p>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <Link
              href="/login"
              className="rounded-lg bg-[#2D5A3D] px-8 py-4 text-center text-sm font-semibold uppercase tracking-widest text-white transition-colors hover:bg-[#244B33]"
            >
              GET STARTED FREE
            </Link>
            <Link
              href="#features"
              className="rounded-lg border border-[#F2F0EB] px-8 py-4 text-center text-sm font-semibold uppercase tracking-widest text-[#F2F0EB] transition-colors hover:bg-[#F2F0EB]/10"
            >
              SEE HOW IT WORKS
            </Link>
          </div>
          <p className="mt-4 text-xs uppercase tracking-widest text-[#F2F0EB]/30">
            88 founding member spots · $49.99/yr locked forever
          </p>
        </div>
      </section>

      {/* ═══ TRANSITION ═══ */}
      <div className="h-32 bg-gradient-to-b from-[#111111] to-[#F2F0EB]" />

      {/* ═══ SECTION 2 — VALUE PROP 1: GOLF TRIPS, HANDLED ═══ */}
      <section id="features" className="bg-[#F2F0EB] px-6 py-24 lg:px-16">
        <div className="mx-auto max-w-6xl">
          <p className="font-sans text-[11px] font-medium uppercase tracking-[0.08em] text-[#5C5C5C] mb-2">How It Works</p>
          <h2 className="font-headline text-[28px] font-medium tracking-tight text-[#111111] sm:text-[40px]">
            Golf Trips, Handled.
          </h2>
          <p className="mt-3 text-[16px] text-[#111111]/60">
            From &ldquo;we should do a trip&rdquo; to &ldquo;that was the best trip ever&rdquo; &mdash; one app.
          </p>

          {/* 4 Steps */}
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {/* Step 1 — Explore */}
            <div className="rounded-[10px] bg-white p-6 shadow-sm">
              <Search className="mb-4 h-7 w-7 text-[#2D5A3D]" />
              <h3 className="mb-2 text-lg font-semibold text-[#111111]">Explore</h3>
              <p className="text-sm leading-relaxed text-[#8A8A8A]">
                50+ curated destinations with real pricing and insider intel
              </p>
            </div>
            {/* Step 2 — Coordinate */}
            <div className="rounded-[10px] bg-white p-6 shadow-sm">
              <Users className="mb-4 h-7 w-7 text-[#2D5A3D]" />
              <h3 className="mb-2 text-lg font-semibold text-[#111111]">Coordinate</h3>
              <p className="text-sm leading-relaxed text-[#8A8A8A]">
                One link. Your crew commits, votes on dates, and locks in.
              </p>
            </div>
            {/* Step 3 — Play */}
            <div className="rounded-[10px] bg-white p-6 shadow-sm">
              <Gamepad2 className="mb-4 h-7 w-7 text-[#2D5A3D]" />
              <h3 className="mb-2 text-lg font-semibold text-[#111111]">Play</h3>
              <p className="text-sm leading-relaxed text-[#8A8A8A]">
                Live scorecards, skins, Nassau bets — calculated automatically
              </p>
            </div>
            {/* Step 4 — Settle */}
            <div className="rounded-[10px] bg-white p-6 shadow-sm">
              <CreditCard className="mb-4 h-7 w-7 text-[#2D5A3D]" />
              <h3 className="mb-2 text-lg font-semibold text-[#111111]">Settle</h3>
              <p className="text-sm leading-relaxed text-[#8A8A8A]">
                Who owes who. One tap to Venmo. No spreadsheets.
              </p>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-10">
            <Link
              href="/explore"
              className="inline-block rounded-[10px] bg-[#2D5A3D] px-8 py-4 text-[16px] font-medium text-[#F2F0EB] transition-colors hover:bg-[#244B33]"
            >
              Explore Destinations →
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ SECTION 3 — WHERE TO NEXT? ═══ */}
      <section className="border-t border-[#111111]/10 bg-[#F2F0EB] px-6 py-24 lg:px-16">
        <div className="mx-auto max-w-6xl">
          <p className="font-sans text-[11px] font-medium uppercase tracking-[0.08em] text-[#5C5C5C] mb-2">Destinations</p>
          <h2 className="font-headline text-[28px] font-medium tracking-tight text-[#111111] sm:text-[40px]">
            Where to Next?
          </h2>
          <p className="mt-3 text-[16px] text-[#111111]/60">
            50+ curated golf trips. Real courses. Real pricing.
          </p>

          {/* 6 destination cards */}
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {exploreDestinations.map((dest) => (
              <Link
                key={dest.id}
                href={`/explore#${dest.id}`}
                className="group rounded-[10px] bg-white p-6 shadow-sm transition-all hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <h3 className="text-lg font-semibold text-[#111111] group-hover:text-[#2D5A3D] transition-colors">
                    {dest.name}
                  </h3>
                  <span className="text-sm font-bold text-[#2D5A3D]">{dest.price}</span>
                </div>
                <p className="mt-1 text-xs text-[#8A8A8A]">{dest.info}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {dest.vibes.map((vibe) => (
                    <span
                      key={vibe}
                      className="rounded-full bg-[#2D5A3D]/10 px-2.5 py-0.5 text-xs font-medium text-[#2D5A3D]"
                    >
                      {vibe}
                    </span>
                  ))}
                </div>
              </Link>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-10">
            <Link
              href="/explore"
              className="inline-block rounded-[10px] bg-[#2D5A3D] px-8 py-4 text-[16px] font-medium text-[#F2F0EB] transition-colors hover:bg-[#244B33]"
            >
              See all 50+ destinations →
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ SECTION 4 — VALUE PROP 2: BETS MADE SIMPLE ═══ */}
      <section className="border-t border-[#111111]/10 bg-[#F2F0EB] px-6 pt-24 pb-24 lg:px-16">
        <div className="mx-auto max-w-6xl">
          <p className="font-sans text-[11px] font-medium uppercase tracking-[0.08em] text-[#5C5C5C] mb-2">Scoring & Bets</p>
          <h2 className="font-headline text-[28px] font-medium tracking-tight text-[#111111] sm:text-[40px]">
            Bets Made Simple.
          </h2>
          <p className="mt-3 text-[16px] text-[#111111]/60">
            Skins. Nassau. Match play. Best ball. Pick your game — we handle the math.
          </p>

          {/* Scorecard preview */}
          <div className="mx-auto mt-12 max-w-2xl">
            <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
              <div className="flex items-center justify-between bg-[#111111] px-6 py-4">
                <span className="font-semibold uppercase text-[#F2F0EB]">
                  TPC SCOTTSDALE
                </span>
                <span className="font-semibold uppercase text-[#2D5A3D]">
                  HOLE 16
                </span>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-[#8A8A8A]">
                      Player
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium uppercase text-[#8A8A8A]">
                      Front
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium uppercase text-[#8A8A8A]">
                      Back
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium uppercase text-[#8A8A8A]">
                      Total
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium uppercase text-[#8A8A8A]">
                      Skins
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase text-[#8A8A8A]">
                      Money
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sampleScorecard.map((player, i) => (
                    <tr key={player.name} className="border-b border-gray-100">
                      <td className="px-6 py-3 font-semibold text-[#111111]">
                        {player.name}
                      </td>
                      <td className="px-4 py-3 text-center text-[#8A8A8A]">
                        {player.front}
                      </td>
                      <td className="px-4 py-3 text-center text-[#8A8A8A]">
                        {player.back}
                      </td>
                      <td
                        className={`px-4 py-3 text-center font-semibold ${
                          i === 0 ? "text-[#2D5A3D]" : "text-[#111111]"
                        }`}
                      >
                        {player.total}
                      </td>
                      <td className="px-4 py-3 text-center text-[#8A8A8A]">
                        {player.skins}
                      </td>
                      <td
                        className={`px-4 py-3 text-right font-semibold ${
                          player.money.startsWith("+")
                            ? "text-emerald-600"
                            : "text-[#C4423B]"
                        }`}
                      >
                        {player.money}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="mt-8 text-center text-[16px] text-[#111111]/60">
              Commissioner Mode is free. Forever.{" "}
              <Link
                href="/login?redirect=/rounds/new"
                className="font-medium text-[#2D5A3D] underline underline-offset-2 hover:text-[#244B33]"
              >
                Start a round →
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* ═══ SECTION 5 — FOUNDING MEMBERS + PRICING ═══ */}
      <section className="border-t border-[#111111]/10 bg-[#F2F0EB] px-6 py-24 lg:px-16">
        <div className="mx-auto max-w-6xl">
          <p className="font-sans text-[11px] font-medium uppercase tracking-[0.08em] text-[#5C5C5C] mb-2">Pricing</p>
          <h2 className="font-headline mb-16 text-4xl font-medium tracking-tighter text-[#111111] md:text-5xl">
            Pick Your Play.
          </h2>
          <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-2">
            {/* Founding Members card */}
            <div className="rounded-2xl bg-white p-10 shadow-sm">
              <h3 className="font-headline mb-4 text-2xl font-medium text-[#111111]">
                Founding Members
              </h3>
              <p className="mb-4 text-[#8A8A8A]">
                88 founding member spots remaining. Lock in $49.99/yr — the price never goes up.
              </p>
              <div className="mb-6">
                <span className="text-4xl font-semibold text-[#111111]">$49.99</span>
                <span className="text-sm text-[#8A8A8A]">/year</span>
                <span className="mt-1 block text-sm text-[#8A8A8A]">Lock in this rate forever.</span>
              </div>
              <div className="mb-6 space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#2D5A3D]" />
                  <span className="text-sm text-[#8A8A8A]">Founding Member badge</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#2D5A3D]" />
                  <span className="text-sm text-[#8A8A8A]">Priority access</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#2D5A3D]" />
                  <span className="text-sm text-[#8A8A8A]">All Pro features</span>
                </div>
              </div>
              <p className="mb-2 text-sm text-[#8A8A8A]">
                88 of 100 spots remaining
              </p>
              <div className="h-1.5 rounded-full bg-gray-200">
                <div
                  className="h-1.5 rounded-full bg-[#2D5A3D]"
                  style={{ width: "12%" }}
                />
              </div>
              <Link
                href="/login"
                className="mt-6 block w-full rounded-lg bg-[#2D5A3D] py-3 text-center text-sm font-semibold uppercase text-white transition-colors hover:bg-[#244B33]"
              >
                CLAIM YOUR SPOT
              </Link>
            </div>

            {/* Pricing card */}
            <div className="rounded-2xl bg-white p-10 shadow-sm">
              <h3 className="mb-1 text-xl font-semibold text-[#111111]">
                Free to keep score.
              </h3>
              <p className="mb-8 text-sm text-[#8A8A8A]">
                Pay when money&apos;s on the line.
              </p>

              {/* Tier 1 — Commissioner */}
              <div className="mb-3 rounded-xl bg-[#F2F0EB] p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold uppercase text-[#111111]">
                    COMMISSIONER
                  </span>
                  <span className="font-semibold text-[#111111]">$0 forever</span>
                </div>
                <div className="mt-2 space-y-1">
                  <p className="text-xs text-[#8A8A8A]">Score rounds, basic skins tracking</p>
                  <p className="text-xs text-[#8A8A8A]">Shareable recap link</p>
                  <p className="text-xs text-[#8A8A8A]">No bet tracking, no trips</p>
                </div>
              </div>

              {/* Tier 2 — Nassau Pro */}
              <div className="mb-3 rounded-xl border border-[#2D5A3D] bg-[#F2F0EB] p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold uppercase text-[#2D5A3D]">
                    NASSAU PRO
                  </span>
                  <span className="font-semibold text-[#111111]">$6.99/mo</span>
                </div>
                <div className="mt-2 space-y-1">
                  <p className="text-xs text-[#8A8A8A]">Bet tracking + settlements</p>
                  <p className="text-xs text-[#8A8A8A]">Trip planning + expenses</p>
                  <p className="text-xs text-[#8A8A8A]">Live scorecard</p>
                </div>
              </div>

              {/* Tier 3 — Founding Member */}
              <div className="mb-3 rounded-xl border-2 border-[#B8976A] bg-[#111111] p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold uppercase text-[#B8976A]">
                    FOUNDING MEMBER
                  </span>
                  <div className="flex items-center">
                    <span className="font-semibold text-[#F2F0EB]">$49.99/yr</span>
                    <span className="ml-2 rounded bg-[#B8976A] px-2 py-0.5 text-xs font-semibold uppercase text-white">
                      LIMITED
                    </span>
                  </div>
                </div>
                <div className="mt-2 space-y-1">
                  <p className="text-xs text-[#F2F0EB]/60">All Pro features included</p>
                  <p className="text-xs text-[#F2F0EB]/60">Founding Member badge forever</p>
                  <p className="text-xs text-[#F2F0EB]/60">Rate locked — never increases</p>
                </div>
              </div>

              <Link
                href="/login"
                className="mt-4 block w-full rounded-lg bg-[#2D5A3D] py-3 text-center text-sm font-semibold uppercase text-white"
              >
                START FREE TRIAL
              </Link>
              <Link
                href="/login"
                className="mt-2 block w-full rounded-lg bg-[#B8976A] py-3 text-center text-sm font-semibold uppercase text-white"
              >
                CLAIM FOUNDING SPOT — $49.99/YR
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ RECENT ARTICLES ═══ */}
      <section className="bg-[#F2F0EB] px-6 py-16 lg:px-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-8 font-headline text-[28px] font-medium tracking-tight text-[#111111]">
            Latest From the Blog
          </h2>
          <RecentArticles />
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="bg-[#111111] px-6 py-16 text-center">
        <p className="mb-2 font-headline text-[32px] font-medium text-[#F2F0EB]">Nassau</p>
        <p className="mb-8 text-sm text-[#F2F0EB]/60">
          Built by a golfer, for golfers.
        </p>
        <div className="mb-6 flex justify-center gap-8">
          <a
            href="mailto:grayson@nassau.golf"
            className="text-sm text-[#8A8A8A] transition-colors hover:text-[#F2F0EB]"
          >
            Feedback
          </a>
          <Link
            href="/privacy"
            className="text-sm text-[#8A8A8A] transition-colors hover:text-[#F2F0EB]"
          >
            Privacy
          </Link>
          <Link
            href="/terms"
            className="text-sm text-[#8A8A8A] transition-colors hover:text-[#F2F0EB]"
          >
            Terms
          </Link>
          <a
            href="mailto:support@nassau.golf"
            className="text-sm text-[#8A8A8A] transition-colors hover:text-[#F2F0EB]"
          >
            Support
          </a>
        </div>
        <p className="text-xs text-[#8A8A8A]">
          © 2026 Nassau Golf. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
