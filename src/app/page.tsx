import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { CheckCircle2, ChevronLeft, ChevronRight, MapPin, Users, Trophy } from "lucide-react";
import AuthRedirect from "./auth-redirect";
import { createServiceClient } from "@/lib/supabase/admin";

export const metadata: Metadata = {
  title: "Nassau \u2014 Your Golf Trip, Handled.",
  description:
    "Nassau is the operating system for golf trips. Plan trips, coordinate your crew, track rounds, and settle bets \u2014 all in one app.",
  openGraph: {
    title: "Nassau \u2014 Your Golf Trip, Handled.",
    description: "The operating system for golf trips.",
    images: [
      "/api/og/default?title=Plan%20Trips.%0ATrack%20Rounds.%0ASettle%20Bets.&subtitle=The%20app%20for%20groups%20who%20actually%20play.",
    ],
  },
};

/* --- Sample data for live scorecard demo --- */

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

/* --- Explore destination cards data --- */

const exploreDestinations = [
  { name: "Scottsdale, AZ", price: "from $1,650", vibes: ["Resort", "Party"], info: "3N \u00b7 3 rounds", id: "scottsdale-az", image: "https://images.unsplash.com/photo-1535131749006-b7f58c99034b?q=80&w=2070&auto=format&fit=crop" },
  { name: "Bandon Dunes, OR", price: "from $3,200", vibes: ["Bucket List", "Competitive"], info: "3N \u00b7 4 rounds", id: "bandon-dunes-or", image: "https://images.unsplash.com/photo-1600005082646-095e75e347a4?q=80&w=2070&auto=format&fit=crop" },
  { name: "Pinehurst, NC", price: "from $2,200", vibes: ["Bucket List", "Competitive"], info: "3N \u00b7 3 rounds", id: "pinehurst-nc", image: "https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?q=80&w=2070&auto=format&fit=crop" },
  { name: "Myrtle Beach, SC", price: "from $850", vibes: ["Budget", "Party"], info: "3N \u00b7 4 rounds", id: "myrtle-beach-sc", image: "https://images.unsplash.com/photo-1632932197818-c4484afd0432?q=80&w=2070&auto=format&fit=crop" },
  { name: "Pebble Beach, CA", price: "from $3,500", vibes: ["Bucket List", "Scenic"], info: "3N \u00b7 3 rounds", id: "pebble-beach-monterey-ca", image: "https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?q=80&w=2070&auto=format&fit=crop" },
  { name: "St. Andrews, Scotland", price: "from $5,000", vibes: ["Bucket List", "Competitive"], info: "4N \u00b7 3 rounds", id: "st-andrews-scotland", image: "https://images.unsplash.com/photo-1621508638997-e30808c10653?q=80&w=2070&auto=format&fit=crop" },
];

/* --- RecentArticles (preserved) --- */

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

/* --- Home Page --- */

export default async function Home() {
  return (
    <div className="relative">
      <AuthRedirect />

      {/* === STICKY NAV === */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 backdrop-blur-md bg-black/20 lg:px-12">
        <Link href="/" className="font-headline text-2xl font-medium text-[#F2F0EB]">
          Nassau
        </Link>
        <div className="hidden items-center gap-8 md:flex">
          <Link href="/explore" className="text-sm font-medium text-[#F2F0EB]/80 transition-colors hover:text-[#F2F0EB]">
            Trips
          </Link>
          <Link href="/explore" className="text-sm font-medium text-[#F2F0EB]/80 transition-colors hover:text-[#F2F0EB]">
            Explore
          </Link>
          <a href="#pricing" className="text-sm font-medium text-[#F2F0EB]/80 transition-colors hover:text-[#F2F0EB]">
            Pricing
          </a>
          <Link href="/blog" className="text-sm font-medium text-[#F2F0EB]/80 transition-colors hover:text-[#F2F0EB]">
            Blog
          </Link>
        </div>
        <Link
          href="/login"
          className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-[#111111] transition-colors hover:bg-[#F2F0EB]"
        >
          Get started
        </Link>
      </nav>

      {/* === SECTION 1 - HERO === */}
      <section className="relative flex min-h-screen flex-col justify-end overflow-hidden px-6 pb-16 lg:px-12">
        {/* Background image */}
        <Image
          src="https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?q=80&w=2070&auto=format&fit=crop"
          alt="Golf course at dawn"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

        {/* Founding member badge - top right */}
        <div className="absolute right-6 top-24 z-10 hidden rounded-2xl border border-white/10 bg-white/10 px-5 py-4 backdrop-blur-lg lg:block">
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              <div className="h-8 w-8 rounded-full bg-[#2D5A3D] ring-2 ring-white/20" />
              <div className="h-8 w-8 rounded-full bg-[#B8976A] ring-2 ring-white/20" />
              <div className="h-8 w-8 rounded-full bg-[#111111] ring-2 ring-white/20" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#F2F0EB]">88 founding member spots</p>
              <p className="text-xs text-[#F2F0EB]/60">$49.99/yr &mdash; locked forever</p>
            </div>
          </div>
        </div>

        {/* Hero content */}
        <div className="relative z-10 max-w-5xl">
          <h1 className="font-headline text-5xl font-medium leading-[1.05] tracking-tight text-[#F2F0EB] md:text-7xl lg:text-[110px] lg:leading-[1]">
            Your golf trip,
          </h1>
          <h1 className="font-headline text-5xl font-medium leading-[1.05] tracking-tight text-[#2D5A3D] md:text-7xl lg:text-[110px] lg:leading-[1]">
            handled.
          </h1>
          <p className="mt-5 max-w-lg text-lg leading-relaxed text-[#F2F0EB]/70">
            The operating system for golf trips. From the first group text to the last settlement &mdash; one app.
          </p>
          <div className="mt-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <Link
              href="/login"
              className="rounded-full bg-white px-8 py-4 text-sm font-semibold text-[#111111] transition-colors hover:bg-[#F2F0EB]"
            >
              Plan a trip
            </Link>
            <Link
              href="/explore"
              className="group flex items-center gap-2 text-sm font-medium text-[#F2F0EB]/80 transition-colors hover:text-[#F2F0EB]"
            >
              Explore destinations
              <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Scroll indicator - bottom right */}
        <div className="absolute bottom-8 right-6 z-10 hidden flex-col items-center gap-2 lg:flex">
          <span className="text-xs font-medium uppercase tracking-widest text-[#F2F0EB]/40">Scroll down</span>
          <div className="h-8 w-px bg-gradient-to-b from-[#F2F0EB]/40 to-transparent" />
        </div>
      </section>

      {/* === SECTION 2 - HOW IT WORKS === */}
      <section id="features" className="bg-[#F5F5F0] px-6 py-24 lg:px-12">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-3xl bg-white p-8 shadow-sm lg:p-16">
            <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.15em] text-[#8A8A8A]">How it works</p>
            <h2 className="mt-3 font-headline text-3xl font-medium tracking-tight text-[#111111] sm:text-5xl">
              A new standard in golf trip coordination
            </h2>
            <p className="mt-4 max-w-2xl text-lg text-[#111111]/60">
              From &ldquo;we should do a trip&rdquo; to &ldquo;that was the best trip ever&rdquo; &mdash; Nassau handles the logistics so you can focus on the golf.
            </p>

            <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-3">
              {/* Card 1 */}
              <div className="rounded-2xl bg-[#F5F5F0] p-8">
                <MapPin className="mb-5 h-8 w-8 text-[#2D5A3D]" />
                <p className="font-headline text-5xl font-medium text-[#111111]">50+</p>
                <p className="mt-3 text-sm leading-relaxed text-[#8A8A8A]">
                  Curated destinations with real pricing and insider intel
                </p>
              </div>
              {/* Card 2 */}
              <div className="rounded-2xl bg-[#F5F5F0] p-8">
                <Users className="mb-5 h-8 w-8 text-[#2D5A3D]" />
                <p className="font-headline text-5xl font-medium text-[#111111]">59</p>
                <p className="mt-3 text-sm leading-relaxed text-[#8A8A8A]">
                  Curated trips designed for every kind of golfer group
                </p>
              </div>
              {/* Card 3 */}
              <div className="rounded-2xl bg-[#F5F5F0] p-8">
                <Trophy className="mb-5 h-8 w-8 text-[#2D5A3D]" />
                <p className="font-headline text-5xl font-medium text-[#111111]">$0</p>
                <p className="mt-3 text-sm leading-relaxed text-[#8A8A8A]">
                  Commissioner mode is free forever. No catch.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* === SECTION 3 - TRIPS / DESTINATIONS === */}
      <section className="bg-[#F5F5F0] px-6 py-24 lg:px-12">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-end justify-between">
            <div>
              <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.15em] text-[#8A8A8A]">Trips</p>
              <h2 className="mt-3 font-headline text-3xl font-medium tracking-tight text-[#111111] sm:text-5xl">
                Compete, connect, and enjoy the game
              </h2>
            </div>
            <div className="hidden sm:block">
              <p className="text-right">
                <span className="font-headline text-4xl font-medium text-[#2D5A3D]">6</span>
              </p>
              <p className="text-sm text-[#8A8A8A]">Curated destinations</p>
            </div>
          </div>

          {/* Decorative date strip */}
          <div className="mt-10 flex gap-3 overflow-hidden">
            {["Mon 7", "Tue 8", "Wed 9", "Thu 10", "Fri 11", "Sat 12", "Sun 13"].map((d, i) => (
              <div key={d} className={`flex-shrink-0 rounded-xl px-4 py-2 text-center text-xs font-medium ${i === 4 ? "bg-[#2D5A3D] text-white" : "bg-white text-[#8A8A8A]"}`}>
                {d}
              </div>
            ))}
          </div>

          {/* Horizontal scrolling trip cards */}
          <div className="relative mt-8">
            <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide" style={{ scrollbarWidth: "none" }}>
              {exploreDestinations.map((dest) => (
                <Link
                  key={dest.id}
                  href={`/explore#${dest.id}`}
                  className="group relative flex-shrink-0 overflow-hidden rounded-2xl"
                  style={{ width: 340, height: 440 }}
                >
                  <Image
                    src={dest.image}
                    alt={dest.name}
                    fill
                    sizes="340px"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <div className="mb-3 flex items-center gap-3 text-xs text-[#F2F0EB]/70">
                      <span>{dest.info}</span>
                      <span className="h-1 w-1 rounded-full bg-[#F2F0EB]/40" />
                      <span>{dest.vibes.join(" \u00b7 ")}</span>
                    </div>
                    <h3 className="font-headline text-2xl font-medium text-[#F2F0EB]">
                      {dest.name}
                    </h3>
                    <p className="mt-1 text-sm font-semibold text-[#B8976A]">{dest.price}</p>
                    <div className="mt-4 overflow-hidden transition-all duration-300 max-h-0 group-hover:max-h-12">
                      <span className="inline-block rounded-full bg-white px-5 py-2 text-sm font-semibold text-[#111111]">
                        View trip
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Navigation arrows */}
            <div className="mt-6 flex justify-center gap-3">
              <button
                type="button"
                aria-label="Scroll left"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-[#111111]/10 bg-white text-[#111111] transition-colors hover:bg-[#111111] hover:text-white"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                aria-label="Scroll right"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-[#111111]/10 bg-white text-[#111111] transition-colors hover:bg-[#111111] hover:text-white"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* === SECTION 4 - SCORING & BETS === */}
      <section className="bg-[#F2F0EB] px-6 py-24 lg:px-12">
        <div className="mx-auto max-w-6xl">
          <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.15em] text-[#8A8A8A]">Scoring & Bets</p>
          <h2 className="mt-3 font-headline text-3xl font-medium tracking-tight text-[#111111] sm:text-5xl">
            Bets made simple.
          </h2>
          <p className="mt-4 max-w-2xl text-lg text-[#111111]/60">
            Skins. Nassau. Match play. Best ball. Pick your game &mdash; we handle the math.
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
                Start a round &rarr;
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* === SECTION 5 - PRICING === */}
      <section id="pricing" className="bg-[#F5F5F0] px-6 py-24 lg:px-12">
        <div className="mx-auto max-w-6xl">
          <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.15em] text-[#8A8A8A]">Pricing</p>
          <h2 className="mt-3 font-headline mb-16 text-3xl font-medium tracking-tight text-[#111111] sm:text-5xl">
            Pick Your Play.
          </h2>
          <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-2">
            {/* Founding Members card */}
            <div className="rounded-2xl bg-white p-10 shadow-sm">
              <h3 className="font-headline mb-4 text-2xl font-medium text-[#111111]">
                Founding Members
              </h3>
              <p className="mb-4 text-[#8A8A8A]">
                88 founding member spots remaining. Lock in $49.99/yr &mdash; the price never goes up.
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
                className="mt-6 block w-full rounded-full bg-[#2D5A3D] py-3 text-center text-sm font-semibold uppercase text-white transition-colors hover:bg-[#244B33]"
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

              {/* Tier 1 - Commissioner */}
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

              {/* Tier 2 - Nassau Pro */}
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

              {/* Tier 3 - Founding Member */}
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
                  <p className="text-xs text-[#F2F0EB]/60">Rate locked &mdash; never increases</p>
                </div>
              </div>

              <Link
                href="/login"
                className="mt-4 block w-full rounded-full bg-[#2D5A3D] py-3 text-center text-sm font-semibold uppercase text-white"
              >
                START FREE TRIAL
              </Link>
              <Link
                href="/login"
                className="mt-2 block w-full rounded-full bg-[#B8976A] py-3 text-center text-sm font-semibold uppercase text-white"
              >
                CLAIM FOUNDING SPOT &mdash; $49.99/YR
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* === RECENT ARTICLES === */}
      <section className="bg-[#F5F5F0] px-6 py-24 lg:px-12">
        <div className="mx-auto max-w-6xl">
          <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.15em] text-[#8A8A8A]">Blog</p>
          <h2 className="mt-3 mb-10 font-headline text-3xl font-medium tracking-tight text-[#111111] sm:text-5xl">
            Latest From the Blog
          </h2>
          <RecentArticles />
        </div>
      </section>

      {/* === CTA + FOOTER === */}
      <footer className="bg-[#111111] px-6 py-24 lg:px-12">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-headline text-4xl font-medium text-[#F2F0EB] sm:text-6xl">
            Your golf trip, handled.
          </h2>
          <p className="mx-auto mt-5 max-w-lg text-lg text-[#F2F0EB]/60">
            Join a growing community of golfers who plan smarter, play better, and settle up faster.
          </p>

          {/* Email input */}
          <div className="mx-auto mt-10 flex max-w-md items-center gap-2 rounded-full bg-[#1E1E1E] p-1.5">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 bg-transparent px-4 py-2 text-sm text-[#F2F0EB] placeholder:text-[#F2F0EB]/30 focus:outline-none"
            />
            <Link
              href="/login"
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#2D5A3D] text-white transition-colors hover:bg-[#244B33]"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>

          {/* Social icons */}
          <div className="mt-10 flex justify-center gap-5">
            {/* X / Twitter */}
            <a href="#" aria-label="X" className="flex h-10 w-10 items-center justify-center rounded-full border border-[#F2F0EB]/10 text-[#F2F0EB]/40 transition-colors hover:border-[#F2F0EB]/30 hover:text-[#F2F0EB]">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
            {/* Instagram */}
            <a href="#" aria-label="Instagram" className="flex h-10 w-10 items-center justify-center rounded-full border border-[#F2F0EB]/10 text-[#F2F0EB]/40 transition-colors hover:border-[#F2F0EB]/30 hover:text-[#F2F0EB]">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <rect x="2" y="2" width="20" height="20" rx="5" />
                <circle cx="12" cy="12" r="5" />
                <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none" />
              </svg>
            </a>
            {/* Facebook */}
            <a href="#" aria-label="Facebook" className="flex h-10 w-10 items-center justify-center rounded-full border border-[#F2F0EB]/10 text-[#F2F0EB]/40 transition-colors hover:border-[#F2F0EB]/30 hover:text-[#F2F0EB]">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </a>
            {/* LinkedIn */}
            <a href="#" aria-label="LinkedIn" className="flex h-10 w-10 items-center justify-center rounded-full border border-[#F2F0EB]/10 text-[#F2F0EB]/40 transition-colors hover:border-[#F2F0EB]/30 hover:text-[#F2F0EB]">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
            </a>
          </div>
        </div>

        {/* Footer links */}
        <div className="mx-auto mt-16 max-w-6xl border-t border-[#F2F0EB]/10 pt-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <Link href="/" className="font-headline text-xl font-medium text-[#F2F0EB]">
              Nassau
            </Link>
            <div className="flex gap-8">
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
              &copy; 2026 Nassau Golf. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
