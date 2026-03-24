import Link from "next/link";
import Image from "next/image";
import {
  MapPin,
  Flag,
  DollarSign,
  LayoutDashboard,
  Check,
} from "lucide-react";
import AuthRedirect from "./auth-redirect";
import { createServiceClient } from "@/lib/supabase/admin";

/* ─── Supabase blog post type ─── */
interface BlogPost {
  id: string;
  title: string;
  slug: string;
  meta_description: string | null;
  featured_image_url: string | null;
  reading_time_minutes: number | null;
  word_count: number | null;
  tags: string[] | null;
  published_at: string;
}

async function RecentArticles(): Promise<React.JSX.Element> {
  const supabase = createServiceClient();
  const { data: posts } = await supabase
    .from("seo_blog_posts")
    .select(
      "id, title, slug, meta_description, featured_image_url, reading_time_minutes, word_count, tags, published_at",
    )
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(3);

  const typedPosts: BlogPost[] | null = posts as BlogPost[] | null;

  if (!typedPosts || typedPosts.length === 0) {
    return (
      <p className="text-center text-zinc-400 py-8">Articles coming soon.</p>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {typedPosts.map((post: BlogPost) => (
        <Link
          key={post.id}
          href={`/blog/${post.slug}`}
          className="group overflow-hidden rounded-xl border border-zinc-200 transition-shadow hover:shadow-md"
        >
          {post.featured_image_url ? (
            <div className="aspect-video overflow-hidden bg-zinc-100">
              <img
                src={post.featured_image_url}
                alt={post.title}
                className="h-full w-full object-cover transition-transform group-hover:scale-105"
              />
            </div>
          ) : (
            <div className="flex aspect-video items-center justify-center bg-gradient-to-br from-emerald-800 to-slate-900">
              <span className="text-4xl font-extrabold text-emerald-500/20">
                N
              </span>
            </div>
          )}
          <div className="p-5">
            {post.tags?.[0] && (
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                {post.tags[0]}
              </span>
            )}
            <h3 className="mt-2 font-semibold text-zinc-900 group-hover:text-emerald-700 transition-colors line-clamp-2">
              {post.title}
            </h3>
            <p className="mt-1 text-sm text-zinc-500 line-clamp-2">
              {post.meta_description}
            </p>
            <div className="mt-3 text-xs text-zinc-400">
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

/* ─── Feature data ─── */
interface Feature {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  side: "left" | "right";
  card: React.JSX.Element;
}

const features: Feature[] = [
  {
    icon: MapPin,
    title: "PLAN A TRIP",
    description:
      "Stop the 50-email chain. Organize tee times, lodging, and pairings in one clean hub. Syncs directly to everyone\u2019s calendar.",
    side: "left",
    card: (
      <div className="bg-white p-10 rounded-2xl shadow-sm space-y-6">
        <div className="flex justify-between items-center">
          <span className="bg-[#0D7377] text-white px-4 py-1.5 rounded-lg text-xs font-bold tracking-widest uppercase">
            SCOTTSDALE &apos;24
          </span>
          <span className="text-zinc-400 text-xs font-bold uppercase">
            4 DAYS &bull; 8 GUYS
          </span>
        </div>
        <div className="space-y-4">
          <div className="flex gap-4 p-4 bg-zinc-50 rounded-xl border border-zinc-100">
            <div
              className="w-14 h-14 bg-zinc-200 rounded-lg flex items-center justify-center font-bold text-zinc-600"
              style={{ fontFamily: "'Helvetica Neue', Arial, sans-serif" }}
            >
              THU
            </div>
            <div>
              <div
                className="text-base font-black text-zinc-900 uppercase"
                style={{ fontFamily: "'Helvetica Neue', Arial, sans-serif" }}
              >
                TPC SCOTTSDALE
              </div>
              <div className="text-sm text-zinc-500">1:45 PM TEE TIME</div>
            </div>
          </div>
          <div className="flex gap-4 p-4 bg-zinc-900 rounded-xl text-white shadow-xl">
            <div className="w-14 h-14 bg-[#D94F2B] rounded-lg flex items-center justify-center font-bold">
              FRI
            </div>
            <div>
              <div
                className="text-base font-black uppercase"
                style={{ fontFamily: "'Helvetica Neue', Arial, sans-serif" }}
              >
                TROON NORTH
              </div>
              <div className="text-sm text-[#D94F2B]">
                STADIUM COURSE &bull; 8:30 AM
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    icon: Flag,
    title: "COMMISSIONER MODE",
    description:
      "Run your own tournament. Manage flights, live leaderboards, and scoring for 4 to 40 players. Everyone stays in the loop, hole by hole.",
    side: "right",
    card: (
      <div className="bg-zinc-900 p-8 rounded-2xl shadow-sm relative overflow-hidden h-[400px]">
        <div className="relative z-10 h-full flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <div className="text-[10px] font-black tracking-widest text-[#0D7377] uppercase">
                LIVE SCORECARD
              </div>
              <div
                className="text-2xl font-black text-white uppercase"
                style={{ fontFamily: "'Helvetica Neue', Arial, sans-serif" }}
              >
                PEBBLE BEACH
              </div>
            </div>
            <div className="bg-red-500 px-3 py-1 rounded-lg text-[10px] font-bold text-white animate-pulse">
              LIVE
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl">
              <span className="font-bold text-white">1. TEAM SMITH</span>
              <span className="font-black text-[#0D7377]">-4</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl">
              <span className="font-bold text-white">2. TEAM JONES</span>
              <span className="font-black text-white">-2</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-white/10 border border-white/20 rounded-2xl">
              <span className="font-bold text-white">3. YOU (TEAM GOLF)</span>
              <span className="font-black text-[#D94F2B]">EVEN</span>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    icon: DollarSign,
    title: "EXPENSE TRACKING",
    description:
      "Stop the Venmo math. Add group dinners, green fees, and airfare. We split it fairly based on who was there. Settle up with one tap.",
    side: "left",
    card: (
      <div className="bg-white p-10 rounded-2xl shadow-sm border border-zinc-100">
        <div className="text-xs font-black tracking-widest text-zinc-400 uppercase mb-6">
          TRIP SETTLEMENT
        </div>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-900 font-black">
              JS
            </div>
            <div className="flex-1">
              <div className="font-bold text-zinc-900">John Smith</div>
              <div className="text-xs text-zinc-500 uppercase font-bold tracking-widest">
                OWES YOU
              </div>
            </div>
            <div className="text-xl font-black text-red-500">$142.50</div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-900 font-black">
              MR
            </div>
            <div className="flex-1">
              <div className="font-bold text-zinc-900">Mike Ross</div>
              <div className="text-xs text-zinc-500 uppercase font-bold tracking-widest">
                OWES YOU
              </div>
            </div>
            <div className="text-xl font-black text-red-500">$88.00</div>
          </div>
          <div className="pt-6 border-t border-zinc-100 flex justify-between items-center">
            <span className="text-zinc-500 font-bold uppercase tracking-widest text-xs">
              TOTAL RECEIVABLE
            </span>
            <span className="text-3xl font-black text-green-600">$230.50</span>
          </div>
        </div>
      </div>
    ),
  },
  {
    icon: LayoutDashboard,
    title: "SEE IT IN ACTION",
    description:
      "A dashboard built for the course. Big buttons, high contrast, and zero lag. Access everything from side-bets to scorecards with a single thumb.",
    side: "right",
    card: (
      <div className="flex justify-center">
        <div className="relative w-72 h-[580px] bg-zinc-950 rounded-[3rem] border-8 border-zinc-800 shadow-sm overflow-hidden">
          <div className="absolute top-0 w-1/3 h-6 bg-zinc-800 left-1/2 -translate-x-1/2 rounded-b-xl" />
          <div className="p-6 pt-12">
            <div className="h-10 w-full bg-zinc-900 rounded-lg mb-8 flex items-center px-4">
              <div className="w-4 h-4 rounded bg-zinc-700" />
            </div>
            <div className="space-y-4">
              <div className="h-40 w-full bg-zinc-900 rounded-2xl p-4 flex flex-col justify-end">
                <div className="h-2 w-20 bg-[#D94F2B] rounded-full mb-2" />
                <div className="h-2 w-32 bg-zinc-800 rounded-full" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="h-24 bg-zinc-900 rounded-2xl" />
                <div className="h-24 bg-zinc-900 rounded-2xl" />
              </div>
              <div className="h-40 w-full bg-zinc-900 rounded-2xl flex items-center justify-center">
                <LayoutDashboard className="w-8 h-8 text-zinc-700" />
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
  },
];

export default async function Home(): Promise<React.JSX.Element> {
  return (
    <div style={{ fontFamily: "'Helvetica Neue', Arial, sans-serif" }}>
      <AuthRedirect />

      {/* ═══ HERO ═══ */}
      <section className="relative min-h-screen overflow-hidden flex flex-col justify-end">
        {/* Background image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=1920"
            alt="Golf course at dawn"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#18181B] via-[#18181B]/60 to-transparent" />
        </div>

        {/* Hero content */}
        <div className="relative z-10 pb-24 px-6 lg:px-16">
          <h1 className="text-6xl md:text-8xl lg:text-9xl font-black uppercase tracking-tighter text-[#F3EDE4] leading-none">
            PLAN TRIPS.
            <br />
            TRACK ROUNDS.
            <br />
            <span className="text-[#D94F2B]">SETTLE BETS.</span>
          </h1>
          <p className="text-[#F3EDE4]/70 text-lg md:text-xl mt-4 max-w-2xl">
            The app for groups who actually play. Any flight, any game, any bet.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <Link
              href="/login"
              className="bg-[#D94F2B] text-white font-black uppercase px-8 py-4 rounded-lg tracking-widest text-sm text-center transition-colors hover:bg-[#c4442a]"
            >
              GET STARTED FREE
            </Link>
            <Link
              href="#features"
              className="border border-[#F3EDE4] text-[#F3EDE4] font-black uppercase px-8 py-4 rounded-lg tracking-widest text-sm text-center transition-colors hover:bg-[#F3EDE4]/10"
            >
              SEE IT IN ACTION
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ TRANSITION ═══ */}
      <div className="h-24 bg-gradient-to-b from-[#18181B] to-[#F3EDE4]" />

      {/* ═══ FEATURES ═══ */}
      <section id="features" className="bg-[#F3EDE4] py-24 px-6 lg:px-16">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-[#18181B] mb-16">
            THE WHOLE GAME.
            <br />
            ONE APP.
          </h2>

          <div className="space-y-48">
            {features.map((feature: Feature) => (
              <div
                key={feature.title}
                className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center"
              >
                <div
                  className={
                    feature.side === "left"
                      ? "order-2 lg:order-1"
                      : "order-2 lg:order-2"
                  }
                >
                  <div className="flex items-center gap-4 mb-8">
                    <feature.icon className="w-10 h-10 text-[#0D7377]" />
                    <h3 className="font-black text-4xl md:text-6xl text-[#18181B] tracking-tight uppercase">
                      {feature.title}
                    </h3>
                  </div>
                  <p className="text-zinc-600 text-xl leading-relaxed mb-8">
                    {feature.description}
                  </p>
                </div>
                <div
                  className={
                    feature.side === "left"
                      ? "order-1 lg:order-2"
                      : "order-1 lg:order-1"
                  }
                >
                  {feature.card}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section className="bg-[#F3EDE4] py-24 px-6 text-center border-t border-[#18181B]/10">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl md:text-7xl font-black uppercase tracking-tighter text-[#18181B] mb-16">
            60 SECONDS. THAT&apos;S IT.
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {(
              [
                { num: "1", label: "PICK DATES" },
                { num: "2", label: "INVITE CREW" },
                { num: "3", label: "PLAY GOLF" },
              ] as const
            ).map((step) => (
              <div key={step.num} className="space-y-6">
                <div
                  className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto shadow-md text-3xl font-black ${
                    step.num === "3"
                      ? "bg-[#18181B] text-[#D94F2B]"
                      : "bg-white text-[#18181B]"
                  }`}
                >
                  {step.num}
                </div>
                <h5 className="font-black text-xl text-[#18181B] uppercase">
                  {step.label}
                </h5>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ PRICING ═══ */}
      <section className="bg-[#F3EDE4] py-24 px-6 border-t border-[#18181B]/10">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tighter text-[#18181B] mb-4">
            PICK YOUR PLAY.
          </h2>
          <p className="text-zinc-500 mb-16">
            Start free. Upgrade when you&apos;re ready.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl">
            {/* Commissioner — Free */}
            <div className="bg-white border border-gray-200 rounded-2xl p-8 flex flex-col justify-between">
              <div>
                <div className="text-gray-500 uppercase text-sm font-black tracking-widest mb-4">
                  COMMISSIONER
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-black text-[#18181B]">$0</span>
                </div>
                <p className="text-gray-500 text-sm mt-1 mb-8">Free forever</p>
                <ul className="space-y-4">
                  {[
                    "Score any round",
                    "Basic skins tracking",
                    "Shareable recap link",
                    "Unlimited rounds",
                  ].map((item: string) => (
                    <li key={item} className="flex items-center gap-3 text-zinc-700">
                      <Check className="h-4 w-4 text-gray-400 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <Link
                href="/login"
                className="mt-10 block w-full py-3 rounded-lg font-black uppercase text-sm text-center border border-[#18181B] text-[#18181B] tracking-widest transition-colors hover:bg-[#18181B] hover:text-white"
              >
                GET STARTED FREE
              </Link>
            </div>

            {/* Nassau Pro */}
            <div className="bg-white border-2 border-[#D94F2B] rounded-2xl p-8 flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-4 right-[-2px] bg-[#C9A54E] text-white text-xs font-black uppercase px-3 py-1 rounded-l-lg tracking-widest">
                MOST POPULAR
              </div>
              <div>
                <div className="text-[#D94F2B] uppercase text-sm font-black tracking-widest mb-4">
                  NASSAU PRO
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-black text-[#18181B]">
                    $6.99
                  </span>
                  <span className="text-gray-500 text-sm">/mo</span>
                </div>
                <p className="text-gray-500 text-sm mt-1 mb-8">
                  30-day free trial &middot; No card required
                </p>
                <ul className="space-y-4">
                  {[
                    "Everything in Commissioner",
                    "Full trip planning",
                    "Nassau bet + skins settlements",
                    "Expense tracking + splits",
                  ].map((item: string) => (
                    <li key={item} className="flex items-center gap-3 text-zinc-700">
                      <Check className="h-4 w-4 text-[#D94F2B] shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <Link
                href="/login"
                className="mt-10 block w-full py-3 rounded-lg font-black uppercase text-sm text-center bg-[#D94F2B] text-white tracking-widest transition-colors hover:bg-[#c4442a]"
              >
                START FREE TRIAL
              </Link>
            </div>
          </div>

          <div className="text-center mt-8">
            <Link
              href="/pricing"
              className="text-[#0D7377] text-sm font-bold hover:underline"
            >
              See full pricing &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="bg-[#18181B] py-16 px-6 text-center">
        <h3 className="text-2xl font-black text-[#F3EDE4] mb-2 uppercase tracking-tighter">
          NASSAU
        </h3>
        <p className="text-[#F3EDE4]/60 text-sm mb-8">
          Built by a golfer, for golfers.
        </p>
        <div className="flex justify-center gap-6 mb-6">
          <Link
            href="/privacy"
            className="text-[#71717A] text-sm hover:text-[#F3EDE4] transition-colors"
          >
            Privacy
          </Link>
          <Link
            href="/terms"
            className="text-[#71717A] text-sm hover:text-[#F3EDE4] transition-colors"
          >
            Terms
          </Link>
          <a
            href="mailto:grayson@nassau.golf"
            className="text-[#71717A] text-sm hover:text-[#F3EDE4] transition-colors"
          >
            Contact
          </a>
        </div>
        <p className="text-[#71717A] text-xs mt-6">
          &copy; 2026 Nassau Golf. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
