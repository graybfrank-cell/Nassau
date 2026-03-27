import Link from "next/link";
import Image from "next/image";
import { Flag, Map, Wallet, CheckCircle2 } from "lucide-react";
import AuthRedirect from "./auth-redirect";
import { createServiceClient } from "@/lib/supabase/admin";

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

      {/* ═══ SECTION 2 — HERO ═══ */}
      <section className="relative flex min-h-screen flex-col justify-end overflow-hidden pb-24 px-6 lg:px-16">
        {/* Background image */}
        <Image
          src="https://images.unsplash.com/photo-dyXifZBEJBk?w=1920"
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
            100 founding member spots · Free for a year
          </p>
        </div>
      </section>

      {/* ═══ SECTION 3 — TRANSITION ═══ */}
      <div className="h-32 bg-gradient-to-b from-[#18181B] to-[#F3EDE4]" />

      {/* ═══ SECTION 4 — FEATURE CARDS ═══ */}
      <section id="features" className="bg-[#F3EDE4] px-6 py-24 lg:px-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-16 text-4xl font-black uppercase tracking-tighter text-[#18181B] md:text-6xl">
            THE WHOLE GAME. ONE APP.
          </h2>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {/* Card 1 — Track Rounds */}
            <Link href="/login?redirect=/rounds" className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm transition-transform duration-300 ease-out hover:scale-[1.03] hover:shadow-md cursor-pointer">
              <Flag className="mb-6 h-8 w-8 text-[#0D7377]" />
              <h3 className="mb-3 text-2xl font-black uppercase text-[#18181B]">
                TRACK ROUNDS
              </h3>
              <p className="mb-8 text-base leading-relaxed text-[#71717A]">
                Scores, skins, and bets — calculated live as you play.
              </p>
              <div className="relative rounded-xl overflow-hidden aspect-[4/3] mt-6">
                <Image
                  src="https://images.unsplash.com/photo-Nmh-pEBRt2Y?w=600"
                  alt="Live golf scorecard tracking"
                  fill
                  className="object-cover"
                />
              </div>
            </Link>
            {/* Card 2 — Plan Trips */}
            <Link href="/login?redirect=/trips" className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm transition-transform duration-300 ease-out hover:scale-[1.03] hover:shadow-md cursor-pointer">
              <Map className="mb-6 h-8 w-8 text-[#0D7377]" />
              <h3 className="mb-3 text-2xl font-black uppercase text-[#18181B]">
                PLAN TRIPS
              </h3>
              <p className="mb-8 text-base leading-relaxed text-[#71717A]">
                Destinations, deposits, commitments. One link to coordinate your
                entire crew.
              </p>
              <div className="relative rounded-xl overflow-hidden aspect-[4/3] mt-6">
                <Image
                  src="https://images.unsplash.com/photo-mwX13QqAM5s?w=600"
                  alt="Golf trip planning"
                  fill
                  className="object-cover"
                />
              </div>
            </Link>
            {/* Card 3 — Settle Up */}
            <Link href="/login?redirect=/settlements" className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm transition-transform duration-300 ease-out hover:scale-[1.03] hover:shadow-md cursor-pointer">
              <Wallet className="mb-6 h-8 w-8 text-[#0D7377]" />
              <h3 className="mb-3 text-2xl font-black uppercase text-[#18181B]">
                SETTLE UP
              </h3>
              <p className="mb-8 text-base leading-relaxed text-[#71717A]">
                Who owes who. Automated splits. One tap to Venmo.
              </p>
              <div className="relative rounded-xl overflow-hidden aspect-[4/3] mt-6">
                <Image
                  src="https://images.unsplash.com/photo-mqQ0BuJ5dsA?w=600"
                  alt="Golf group settling bets"
                  fill
                  className="object-cover"
                />
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ SECTION 5 — LIVE SCORECARD ═══ */}
      <section className="border-t border-[#18181B]/10 bg-[#F3EDE4] px-6 pt-8 pb-24 lg:px-16">
        <div className="mx-auto grid max-w-6xl items-center gap-16 lg:grid-cols-2">
          {/* Left column */}
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-[#0D7377]/10 px-3 py-1 text-xs font-black uppercase tracking-widest text-[#0D7377]">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#0D7377] opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#0D7377]" />
              </span>
              LIVE
            </span>
            <h2 className="mt-4 text-4xl font-black uppercase tracking-tighter text-[#18181B] md:text-6xl">
              FREE TO KEEP SCORE.
            </h2>
            <p className="mt-4 text-lg text-[#71717A]">
              Commissioner Mode. Track any round, right now. No account needed.
            </p>
            <Link
              href="/login"
              className="mt-8 inline-block rounded-lg bg-[#D94F2B] px-8 py-4 text-sm font-black uppercase tracking-widest text-white transition-colors hover:bg-[#c4442a]"
            >
              START A ROUND
            </Link>
          </div>

          {/* Right column — scorecard */}
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
        </div>
      </section>

      {/* ═══ SECTION 6 — FOUNDING MEMBERS + PRICING ═══ */}
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
                First 100 golfers get Pro free for a year. Claim your spot
                before April 1.
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
                47 of 100 spots remaining
              </p>
              <div className="h-1.5 rounded-full bg-gray-200">
                <div
                  className="h-1.5 rounded-full bg-[#0D7377]"
                  style={{ width: "53%" }}
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

      {/* ═══ SECTION 7 — FOOTER ═══ */}
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
