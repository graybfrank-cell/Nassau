import Link from "next/link";
import {
  MapPin,
  DollarSign,
  Shuffle,
  Trophy,
  ArrowRight,
} from "lucide-react";
import AuthRedirect from "./auth-redirect";

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

export default function Home() {
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
            <a
              href="#features"
              className="rounded-lg border border-emerald-500/30 px-6 py-3 text-sm font-semibold text-emerald-300 transition-colors hover:bg-emerald-500/10"
            >
              Learn More
            </a>
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

      {/* CTA */}
      <section className="bg-white px-6 py-20">
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
      <footer className="border-t border-zinc-200 bg-white px-6 py-8">
        <p className="text-center text-sm text-zinc-400">
          Nassau — The Golf Trip Companion
        </p>
      </footer>
    </div>
  );
}
