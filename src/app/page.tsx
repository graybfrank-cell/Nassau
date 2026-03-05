import Link from "next/link";
import {
  MapPin,
  DollarSign,
  Shuffle,
  Trophy,
  ArrowRight,
} from "lucide-react";
import AuthRedirect from "./auth-redirect";
import { createServiceClient } from "@/lib/supabase/admin";

const features = [
  {
    icon: MapPin,
    title: "Trip Planning",
    description:
      "Create trips, add members, set dates, and keep everyone on the same page.",
  },
  {
    icon: DollarSign,
    title: "Expense Tracking",
    description:
      "Log expenses, split costs, and see who owes what — no more awkward math.",
  },
  {
    icon: Shuffle,
    title: "Pairings",
    description:
      "Randomly generate foursomes for each round. Fair, fast, and no arguments.",
  },
  {
    icon: Trophy,
    title: "Skins Game",
    description:
      "Run skins games with automatic scoring, carryovers, and payouts.",
  },
];

async function RecentArticles() {
  const supabase = createServiceClient();
  const { data: posts } = await supabase
    .from("seo_blog_posts")
    .select("id, title, slug, meta_description, featured_image_url, reading_time_minutes, word_count, tags, published_at")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(3);

  if (!posts || posts.length === 0) {
    return (
      <p className="text-center text-zinc-400 py-8">
        Articles coming soon.
      </p>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {posts.map((post) => (
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
              <span className="text-4xl font-extrabold text-emerald-500/20">N</span>
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
              {post.reading_time_minutes || Math.ceil((post.word_count || 0) / 200)} min read
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

export default async function Home() {
  return (
    <div className="min-h-[calc(100vh-64px)]">
      <AuthRedirect />
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-900 via-emerald-800 to-zinc-900 px-6 py-24 sm:py-32">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-600/20 via-transparent to-transparent" />
        <div className="relative mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
            Your Golf Trip,{" "}
            <span className="text-emerald-400">Organized</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-emerald-100/80">
            Plan trips, track expenses, generate pairings, and run skins
            games — all in one place. Nassau is the only companion you need
            for your next golf getaway.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-400"
            >
              Get Started
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/blog"
              className="rounded-lg border border-emerald-500/30 px-6 py-3 text-sm font-semibold text-emerald-300 transition-colors hover:bg-emerald-500/10"
            >
              Read Articles
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="bg-white px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-3xl font-bold tracking-tight text-zinc-900">
            Everything for Your Golf Trip
          </h2>
          <p className="mt-4 text-center text-zinc-500">
            From planning to the 18th hole, Nassau has you covered.
          </p>
          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border border-zinc-200 p-6 transition-shadow hover:shadow-md"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
                  <feature.icon className="h-5 w-5 text-emerald-700" />
                </div>
                <h3 className="mt-4 font-semibold text-zinc-900">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-500">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-zinc-50 px-6 py-20">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center text-2xl font-bold tracking-tight text-zinc-900">
            How It Works
          </h2>
          <div className="mt-12 space-y-8">
            {[
              {
                step: "1",
                title: "Create a Trip",
                desc: "Set a name, destination, and dates for your golf getaway.",
              },
              {
                step: "2",
                title: "Add Your Crew",
                desc: "Add players and enter their handicaps for balanced pairings.",
              },
              {
                step: "3",
                title: "Play & Track",
                desc: "Generate pairings, run skins games, and log expenses as you go.",
              },
              {
                step: "4",
                title: "Settle Up",
                desc: "See who owes what at the end — simplified and fair.",
              },
            ].map((item) => (
              <div key={item.step} className="flex gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold text-white">
                  {item.step}
                </div>
                <div>
                  <h3 className="font-semibold text-zinc-900">{item.title}</h3>
                  <p className="mt-1 text-sm text-zinc-500">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Golf Trip Intel — recent articles */}
      <section className="bg-white px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-zinc-900">
                Golf Trip Intel
              </h2>
              <p className="mt-1 text-zinc-500">
                Guides and tips from the Nassau crew.
              </p>
            </div>
            <Link
              href="/blog"
              className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
            >
              Read all articles &rarr;
            </Link>
          </div>
          <RecentArticles />
        </div>
      </section>

      {/* CTA */}
      <section className="bg-zinc-50 px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900">
            Ready to plan your next trip?
          </h2>
          <p className="mt-4 text-zinc-500">
            Sign up free and start organizing your golf getaway in minutes.
          </p>
          <Link
            href="/login"
            className="mt-8 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
          >
            Start Planning
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-200 bg-white px-6 py-12">
        <div className="mx-auto max-w-5xl grid grid-cols-1 gap-8 sm:grid-cols-3">
          <div>
            <span className="text-lg font-extrabold text-emerald-600">Nassau</span>
            <p className="mt-2 text-sm text-zinc-400">
              The Golf Trip Companion
            </p>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Product</h4>
            <div className="mt-3 space-y-2">
              <Link href="/explore" className="block text-sm text-zinc-600 hover:text-zinc-900">Explore Destinations</Link>
              <Link href="/login" className="block text-sm text-zinc-600 hover:text-zinc-900">Sign In</Link>
            </div>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Resources</h4>
            <div className="mt-3 space-y-2">
              <Link href="/blog" className="block text-sm text-zinc-600 hover:text-zinc-900">Articles</Link>
              <Link href="/blog" className="block text-sm text-zinc-600 hover:text-zinc-900">Golf Trip Guides</Link>
            </div>
          </div>
        </div>
        <div className="mx-auto max-w-5xl mt-8 pt-6 border-t border-zinc-100">
          <p className="text-center text-xs text-zinc-400">
            &copy; {new Date().getFullYear()} Nassau Golf. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
