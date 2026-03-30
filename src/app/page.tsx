import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Flag, Map, Wallet, CheckCircle2, Search, Users, Gamepad2, CreditCard } from "lucide-react";
import AuthRedirect from "./auth-redirect";
import { createServiceClient } from "@/lib/supabase/admin";

export const metadata: Metadata = {
  title: "Nassau — Plan Trips. Track Rounds. Settle Bets.",
  description:
    "The app for golf groups who actually play. Plan trips, track scores, settle bets — all in one place.",
  openGraph: {
    title: "Nassau — Plan Trips. Track Rounds. Settle Bets.",
    description: "The app for golf groups who actually play.",
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
      <p className="py-8 text-center text-[#71717A]">Articles coming soon.</p>
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
            <div className="flex aspect-video items-center justify-center bg-[#18181B]">
              <span className="text-4xl font-black text-[#D94F2B]/20">N</span>
            </div>
          )}
          <div className="p-5">
            {post.tags?.[0] && (
              <span className="rounded-full bg-[#0D7377]/10 px-2.5 py-0.5 text-xs font-medium text-[#0D7377]">
                {post.tags[0]}
              </span>
            )}
            <h3 className="mt-2 font-black text-[#18181B] transition-colors group-hover:text-[#D94F2B] line-clamp-2">
              {post.title}
            </h3>
            <p className="mt-1 text-sm text-[#71717A] line-clamp-2">
              {post.meta_description}
            </p>
            <div className="mt-3 text-xs text-[#71717A]">
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
        <div className="absolute inset-0 bg-gradient-to-t from-[#18181B] via-[#18181B]/50 to-transparent" />

        {/* Content */}
        <div className="relative z-10 max-w-6xl">
          <h1 className="text-6xl font-black uppercase leading-none tracking-tighter text-[#F3EDE4] md:text-8xl lg:text-[120px]">
            PLAN TRIPS.
          </h1>
          <h1 className="text-6xl font-black uppercase leading-none tracking-tighter text-[#F3EDE4] md:text-8xl lg:text-[120px]">
            TRACK ROUNDS.
          </h1>
          <h1 className="text-6xl font-black uppercase leading-none tracking-tighter text-[#D94F2B] md:text-8xl lg:text-[120px]">
            SETTLE BETS.
          </h1>
          <p className="mt-4 max-w-lg text-lg text-[#F3EDE4]/70">
            The app for groups who actually play. Any flight, any game, any bet.
          </p>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <Link
              href="/login"
              className="rounded-lg bg-[#D94F2B] px-8 py-4 text-center text-sm font-black uppercase tracking-widest text-white transition-colors hover:bg-[#c4442a]"
            >
              GET STARTED FREE
            </Link>
            <Link
              href="#features"
              className="rounded-lg border border-[#F3EDE4] px-8 py-4 text-center text-sm font-black uppercase tracking-widest text-[#F3EDE4] transition-colors hover:bg-[#F3EDE4]/10"
            >
              SEE HOW IT WORKS
            </Link>
          </div>
          <p className="mt-4 text-xs uppercase tracking-widest text-[#F3EDE4]/30">
            88 founding member spots · $49.99/yr locked forever
          </p>
        </div>
      </section>

      {/* ═══ TRANSITION ═══ */}
      <div className="h-32 bg-gradient-to-b from-[#18181B] to-[#F3EDE4]" />

      {/* ═══ SECTION 2 — VALUE PROP 1: GOLF TRIPS, HANDLED ═══ */}
      <section id="features" className="bg-[#F3EDE4] px-6 py-24 lg:px-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-[32px] font-black uppercase tracking-tight text-[#18181B] sm:text-[40px]">
            GOLF TRIPS, HANDLED.
          </h2>
          <p className="mt-3 text-[16px] text-[#18181B]/60">
            From &ldquo;we should do a trip&rdquo; to &ldquo;that was the best trip ever&rdquo; &mdash; one app.
          </p>

          {/* 4 Steps */}
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {/* Step 1 — Explore */}
            <div className="rounded-[10px] border border-[#18181B]/10 bg-white p-6">
              <Search className="mb-4 h-7 w-7 text-[#0D7377]" />
              <h3 className="mb-2 text-lg font-black uppercase text-[#18181B]">Explore</h3>
              <p className="text-sm leading-relaxed text-[#71717A]">
                50+ curated destinations with real pricing and insider intel
              </p>
            </div>
            {/* Step 2 — Coordinate */}
            <div className="rounded-[10px] border border-[#18181B]/10 bg-white p-6">
              <Users className="mb-4 h-7 w-7 text-[#0D7377]" />
              <h3 className="mb-2 text-lg font-black uppercase text-[#18181B]">Coordinate</h3>
              <p className="text-sm leading-relaxed text-[#71717A]">
                One link. Your crew commits, votes on dates, and locks in.
              </p>
            </div>
            {/* Step 3 — Play */}
            <div className="rounded-[10px] border border-[#18181B]/10 bg-white p-6">
              <Gamepad2 className="mb-4 h-7 w-7 text-[#0D7377]" />
              <h3 className="mb-2 text-lg font-black uppercase text-[#18181B]">Play</h3>
              <p className="text-sm leading-relaxed text-[#71717A]">
                Live scorecards, skins, Nassau bets — calculated automatically
              </p>
            </div>
            {/* Step 4 — Settle */}
            <div className="rounded-[10px] border border-[#18181B]/10 bg-white p-6">
              <CreditCard className="mb-4 h-7 w-7 text-[#0D7377]" />
              <h3 className="mb-2 text-lg font-black uppercase text-[#18181B]">Settle</h3>
              <p className="text-sm leading-relaxed text-[#71717A]">
                Who owes who. One tap to Venmo. No spreadsheets.
              </p>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-10">
            <Link
              href="/explore"
              className="inline-block rounded-[10px] bg-[#0D7377] px-8 py-4 text-[16px] font-medium text-[#F3EDE4] transition-colors hover:bg-[#0b6264]"
            >
              Explore Destinations →
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ SECTION 3 — WHERE TO NEXT? ═══ */}
      <section className="border-t border-[#18181B]/10 bg-[#F3EDE4] px-6 py-24 lg:px-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-[32px] font-black uppercase tracking-tight text-[#18181B] sm:text-[40px]">
            WHERE TO NEXT?
          </h2>
          <p className="mt-3 text-[16px] text-[#18181B]/60">
            50+ curated golf trips. Real courses. Real pricing.
          </p>

          {/* 6 destination cards */}
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {exploreDestinations.map((dest) => (
              <Link
                key={dest.id}
                href={`/explore#${dest.id}`}
                className="group rounded-[10px] border border-[#18181B]/10 bg-white p-6 transition-all hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <h3 className="text-lg font-black text-[#18181B] group-hover:text-[#D94F2B] transition-colors">
                    {dest.name}
                  </h3>
                  <span className="text-sm font-bold text-[#0D7377]">{dest.price}</span>
                </div>
                <p className="mt-1 text-xs text-[#71717A]">{dest.info}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {dest.vibes.map((vibe) => (
                    <span
                      key={vibe}
                      className="rounded-full bg-[#0D7377]/10 px-2.5 py-0.5 text-xs font-medium text-[#0D7377]"
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
              className="inline-block rounded-[10px] bg-[#0D7377] px-8 py-4 text-[16px] font-medium text-[#F3EDE4] transition-colors hover:bg-[#0b6264]"
            >
              See all 50+ destinations →
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ SECTION 4 — VALUE PROP 2: BETS MADE SIMPLE ═══ */}
      <section className="border-t border-[#18181B]/10 bg-[#F3EDE4] px-6 pt-24 pb-24 lg:px-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-[32px] font-black uppercase tracking-tight text-[#18181B] sm:text-[40px]">
            BETS MADE SIMPLE.
          </h2>
          <p className="mt-3 text-[16px] text-[#18181B]/60">
            Skins. Nassau. Match play. Best ball. Pick your game — we handle the math.
          </p>

          {/* Scorecard preview */}
          <div className="mx-auto mt-12 max-w-2xl">
            <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
              <div className="flex items-center justify-between bg-[#18181B] px-6 py-4">
                <span className="font-black uppercase text-[#F3EDE4]">
                  TPC SCOTTSDALE
                </span>
                <span className="font-black uppercase text-[#D94F2B]">
                  HOLE 16
                </span>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-[#71717A]">
                      Player
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium uppercase text-[#71717A]">
                      Front
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium uppercase text-[#71717A]">
                      Back
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium uppercase text-[#71717A]">
                      Total
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium uppercase text-[#71717A]">
                      Skins
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase text-[#71717A]">
                      Money
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sampleScorecard.map((player, i) => (
                    <tr key={player.name} className="border-b border-gray-100">
                      <td className="px-6 py-3 font-black text-[#18181B]">
                        {player.name}
                      </td>
                      <td className="px-4 py-3 text-center text-[#71717A]">
                        {player.front}
                      </td>
                      <td className="px-4 py-3 text-center text-[#71717A]">
                        {player.back}
                      </td>
                      <td
                        className={`px-4 py-3 text-center font-black ${
                          i === 0 ? "text-[#D94F2B]" : "text-[#18181B]"
                        }`}
                      >
                        {player.total}
                      </td>
                      <td className="px-4 py-3 text-center text-[#71717A]">
                        {player.skins}
                      </td>
                      <td
                        className={`px-4 py-3 text-right font-black ${
                          player.money.startsWith("+")
                            ? "text-emerald-600"
                            : "text-[#D94F2B]"
                        }`}
                      >
                        {player.money}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="mt-8 text-center text-[16px] text-[#18181B]/60">
              Commissioner Mode is free. Forever.{" "}
              <Link
                href="/login?redirect=/rounds/new"
                className="font-medium text-[#D94F2B] underline underline-offset-2 hover:text-[#c4442a]"
              >
                Start a round →
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* ═══ SECTION 5 — FOUNDING MEMBERS + PRICING ═══ */}
      <section className="border-t border-[#18181B]/10 bg-[#F3EDE4] px-6 py-24 lg:px-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-16 text-4xl font-black uppercase tracking-tighter text-[#18181B] md:text-5xl">
            PICK YOUR PLAY.
          </h2>
          <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-2">
            {/* Founding Members card */}
            <div className="rounded-2xl border border-[#0D7377]/20 bg-white p-10 shadow-sm">
              <h3 className="mb-4 text-2xl font-black uppercase text-[#18181B]">
                FOUNDING MEMBERS
              </h3>
              <p className="mb-4 text-[#71717A]">
                88 founding member spots remaining. Lock in $49.99/yr — the price never goes up.
              </p>
              <div className="mb-6">
                <span className="text-4xl font-black text-[#18181B]">$49.99</span>
                <span className="text-sm text-[#71717A]">/year</span>
                <span className="mt-1 block text-sm text-[#71717A]">Lock in this rate forever.</span>
              </div>
              <div className="mb-6 space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#0D7377]" />
                  <span className="text-sm text-[#71717A]">Founding Member badge</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#0D7377]" />
                  <span className="text-sm text-[#71717A]">Priority access</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#0D7377]" />
                  <span className="text-sm text-[#71717A]">All Pro features</span>
                </div>
              </div>
              <p className="mb-2 text-sm text-[#71717A]">
                88 of 100 spots remaining
              </p>
              <div className="h-1.5 rounded-full bg-gray-200">
                <div
                  className="h-1.5 rounded-full bg-[#0D7377]"
                  style={{ width: "12%" }}
                />
              </div>
              <Link
                href="/login"
                className="mt-6 block w-full rounded-lg bg-[#D94F2B] py-3 text-center text-sm font-black uppercase text-white transition-colors hover:bg-[#c4442a]"
              >
                CLAIM YOUR SPOT
              </Link>
            </div>

            {/* Pricing card */}
            <div className="rounded-2xl border border-gray-200 bg-white p-10 shadow-sm">
              <h3 className="mb-1 text-xl font-black text-[#18181B]">
                Free to keep score.
              </h3>
              <p className="mb-8 text-sm text-[#71717A]">
                Pay when money&apos;s on the line.
              </p>

              {/* Tier 1 — Commissioner */}
              <div className="mb-3 rounded-xl bg-[#F3EDE4] p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-black uppercase text-[#18181B]">
                    COMMISSIONER
                  </span>
                  <span className="font-black text-[#18181B]">$0 forever</span>
                </div>
                <div className="mt-2 space-y-1">
                  <p className="text-xs text-[#71717A]">Score rounds, basic skins tracking</p>
                  <p className="text-xs text-[#71717A]">Shareable recap link</p>
                  <p className="text-xs text-[#71717A]">No bet tracking, no trips</p>
                </div>
              </div>

              {/* Tier 2 — Nassau Pro */}
              <div className="mb-3 rounded-xl border border-[#D94F2B] bg-[#F3EDE4] p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-black uppercase text-[#D94F2B]">
                    NASSAU PRO
                  </span>
                  <span className="font-black text-[#18181B]">$6.99/mo</span>
                </div>
                <div className="mt-2 space-y-1">
                  <p className="text-xs text-[#71717A]">Bet tracking + settlements</p>
                  <p className="text-xs text-[#71717A]">Trip planning + expenses</p>
                  <p className="text-xs text-[#71717A]">Live scorecard</p>
                </div>
              </div>

              {/* Tier 3 — Founding Member */}
              <div className="mb-3 rounded-xl border-2 border-[#C9A54E] bg-[#18181B] p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-black uppercase text-[#C9A54E]">
                    FOUNDING MEMBER
                  </span>
                  <div className="flex items-center">
                    <span className="font-black text-[#F3EDE4]">$49.99/yr</span>
                    <span className="ml-2 rounded bg-[#C9A54E] px-2 py-0.5 text-xs font-black uppercase text-white">
                      LIMITED
                    </span>
                  </div>
                </div>
                <div className="mt-2 space-y-1">
                  <p className="text-xs text-[#F3EDE4]/60">All Pro features included</p>
                  <p className="text-xs text-[#F3EDE4]/60">Founding Member badge forever</p>
                  <p className="text-xs text-[#F3EDE4]/60">Rate locked — never increases</p>
                </div>
              </div>

              <Link
                href="/login"
                className="mt-4 block w-full rounded-lg bg-[#D94F2B] py-3 text-center text-sm font-black uppercase text-white"
              >
                START FREE TRIAL
              </Link>
              <Link
                href="/login"
                className="mt-2 block w-full rounded-lg bg-[#C9A54E] py-3 text-center text-sm font-black uppercase text-white"
              >
                CLAIM FOUNDING SPOT — $49.99/YR
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ RECENT ARTICLES ═══ */}
      <section className="bg-[#F3EDE4] px-6 py-16 lg:px-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-8 text-2xl font-black uppercase tracking-tighter text-[#18181B]">
            LATEST FROM THE BLOG
          </h2>
          <RecentArticles />
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="bg-[#18181B] px-6 py-16 text-center">
        <p className="mb-2 text-2xl font-black text-[#F3EDE4]">NASSAU</p>
        <p className="mb-8 text-sm text-[#F3EDE4]/60">
          Built by a golfer, for golfers.
        </p>
        <div className="mb-6 flex justify-center gap-8">
          <a
            href="mailto:grayson@nassau.golf"
            className="text-sm text-[#71717A] transition-colors hover:text-[#F3EDE4]"
          >
            Feedback
          </a>
          <Link
            href="/privacy"
            className="text-sm text-[#71717A] transition-colors hover:text-[#F3EDE4]"
          >
            Privacy
          </Link>
          <Link
            href="/terms"
            className="text-sm text-[#71717A] transition-colors hover:text-[#F3EDE4]"
          >
            Terms
          </Link>
          <a
            href="mailto:support@nassau.golf"
            className="text-sm text-[#71717A] transition-colors hover:text-[#F3EDE4]"
          >
            Support
          </a>
        </div>
        <p className="text-xs text-[#71717A]">
          © 2026 Nassau Golf. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
