import Link from "next/link";
import {
  MapPin,
  DollarSign,
  Users,
  Trophy,
  ArrowRight,
  Calendar,
  CheckCircle2,
  CreditCard,
  Zap,
  Star,
  ChevronRight,
  Clock,
  Target,
} from "lucide-react";
import AuthRedirect from "./auth-redirect";

/* ─── Fake interactive data for product previews ─── */

const tripDestinations = [
  { name: "Scottsdale, AZ", courses: 12, avgCost: "$1,950", temp: "78°", img: "🌵" },
  { name: "Myrtle Beach, SC", courses: 18, avgCost: "$1,400", temp: "72°", img: "🏖️" },
  { name: "Pinehurst, NC", courses: 8, avgCost: "$2,200", temp: "68°", img: "🌲" },
  { name: "Bandon Dunes, OR", courses: 5, avgCost: "$2,800", temp: "58°", img: "🌊" },
];

const sampleItinerary = [
  { day: "Thu", date: "Mar 12", items: ["✈️ Arrive PHX 11:30am", "🏨 Check in Scottsdale Resort", "🍺 Dinner at Jade Bar"] },
  { day: "Fri", date: "Mar 13", items: ["⛳ TPC Stadium 8:15am", "🌮 Lunch at Rehab Burger", "⛳ Grayhawk Raptor 2:00pm"] },
  { day: "Sat", date: "Mar 14", items: ["⛳ We-Ko-Pa Saguaro 7:30am", "🏊 Pool day", "🥩 Steak dinner — Mastro's"] },
  { day: "Sun", date: "Mar 15", items: ["⛳ Troon North Monument 8:00am", "✈️ Depart PHX 4:30pm"] },
];

const sampleScorecard = [
  { name: "Grayson", front: 38, back: 41, total: 79, skins: 3, money: "+$45" },
  { name: "Tyler", front: 42, back: 39, total: 81, skins: 2, money: "+$15" },
  { name: "Jake", front: 44, back: 43, total: 87, skins: 1, money: "-$20" },
  { name: "Marcus", front: 40, back: 45, total: 85, skins: 0, money: "-$40" },
];

const sampleExpenses = [
  { item: "Airbnb (4 nights)", amount: "$1,920", split: "$480/person", by: "Grayson" },
  { item: "TPC Scottsdale", amount: "$740", split: "$185/person", by: "Tyler" },
  { item: "Dinner — Mastro's", amount: "$340", split: "$85/person", by: "Jake" },
  { item: "Uber rides", amount: "$120", split: "$30/person", by: "Marcus" },
];

export default function Home() {
  return (
    <div className="min-h-[calc(100vh-64px)] bg-zinc-950">
      <AuthRedirect />

      {/* ═══ HERO ═══ */}
      <section className="relative overflow-hidden px-6 py-20 sm:py-28">
        {/* Background image */}
        <div className="absolute inset-0">
          <img src="/hero-bg.jpg" alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/70 via-zinc-950/80 to-zinc-950" />
        </div>
        {/* Glow effect */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#D94F2B]/15 via-zinc-950 to-zinc-950" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-[#D94F2B]/5 rounded-full blur-3xl" />
        
        <div className="relative mx-auto max-w-5xl">
          <div className="text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-[#D94F2B]/20 bg-[#D94F2B]/10 px-4 py-1.5 mb-8">
              <Zap className="h-3.5 w-3.5 text-[#D94F2B]" />
              <span className="text-xs font-medium text-[#e8785e]">Launching April 1, 2026</span>
            </div>

            <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight text-white leading-[1.1]">
              Plan trips. Track rounds.<br />
              <span className="text-[#D94F2B]">Settle bets. All in one place.</span>
            </h1>
            
            <p className="mx-auto mt-6 max-w-2xl text-lg text-zinc-400 leading-relaxed">
              Nassau replaces the 47-text thread, the shared spreadsheet nobody updates, 
              and the buddy who &quot;forgot&quot; he owes you $85.

            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/login"
                className="group inline-flex items-center gap-2 rounded-xl bg-[#D94F2B] px-8 py-4 text-base font-bold text-white shadow-lg shadow-[#D94F2B]/20 transition-all hover:bg-[#D94F2B] hover:shadow-[#D94F2B]/20 hover:-translate-y-0.5"
              >
                Start Free — No Card Required
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <a
                href="#trip-planner"
                className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 px-8 py-4 text-base font-semibold text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white"
              >
                See How It Works
              </a>
            </div>

            {/* Social proof */}
            <div className="mt-12 flex items-center justify-center gap-6 text-sm text-zinc-500">
              <div className="flex items-center gap-1.5">
                <Users className="h-4 w-4" />
                <span>Join 8+ golfers already on Nassau</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Star className="h-4 w-4 text-amber-400" />
                <span>Free forever for rounds</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ TWO PILLARS ═══ */}
      <section className="px-6 py-12">
        <div className="mx-auto max-w-5xl grid sm:grid-cols-2 gap-6">
          <Link href="/login" className="group relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 p-8 transition-all hover:border-[#D94F2B]/30 hover:bg-zinc-900/80">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#D94F2B]/5 rounded-full blur-2xl" />
            <div className="relative">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#D94F2B]/10 mb-4">
                <MapPin className="h-6 w-6 text-[#D94F2B]" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Plan a Trip</h3>
              <p className="text-sm text-zinc-400 leading-relaxed mb-4">
                Pick a destination, invite your crew, build the itinerary, split costs — 
                all without a single spreadsheet.
              </p>
              <span className="inline-flex items-center gap-1 text-sm font-medium text-[#D94F2B] group-hover:gap-2 transition-all">
                Start planning <ChevronRight className="h-4 w-4" />
              </span>
            </div>
          </Link>

          <Link href="/login" className="group relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 p-8 transition-all hover:border-amber-500/30 hover:bg-zinc-900/80">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl" />
            <div className="relative">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 mb-4">
                <Trophy className="h-6 w-6 text-amber-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Track a Round</h3>
              <p className="text-sm text-zinc-400 leading-relaxed mb-4">
                Commissioner Mode — set up skins, Nassau bets, track scores live, 
                and settle up before you hit the parking lot. Free forever.
              </p>
              <span className="inline-flex items-center gap-1 text-sm font-medium text-amber-400 group-hover:gap-2 transition-all">
                Track a round <ChevronRight className="h-4 w-4" />
              </span>
            </div>
          </Link>
        </div>
      </section>

      {/* ═══ SECTION 1: TRIP PLANNER PREVIEW ═══ */}
      <section id="trip-planner" className="px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold text-[#D94F2B] uppercase tracking-widest mb-3">Trip Planning</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white">
              Pick a destination. We&apos;ll handle the rest.
            </h2>
            <p className="mt-4 text-zinc-400 max-w-xl mx-auto">
              AI-powered trip ideation, itinerary builder, expense splitting, and group coordination — 
              everything your trip captain needs.
            </p>
          </div>

          {/* Destination cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            {tripDestinations.map((dest) => (
              <Link
                href="/login"
                key={dest.name}
                className="group rounded-xl border border-zinc-800 bg-zinc-900 p-4 transition-all hover:border-[#D94F2B]/30 hover:-translate-y-1 hover:shadow-lg hover:shadow-[#D94F2B]/5"
              >
                <div className="text-3xl mb-3">{dest.img}</div>
                <h4 className="font-semibold text-white text-sm">{dest.name}</h4>
                <div className="mt-2 flex items-center gap-3 text-xs text-zinc-500">
                  <span>{dest.courses} courses</span>
                  <span>{dest.temp}</span>
                </div>
                <div className="mt-2 text-sm font-bold text-[#D94F2B]">{dest.avgCost}<span className="text-xs font-normal text-zinc-500">/person</span></div>
              </Link>
            ))}
          </div>

          {/* Itinerary preview */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 overflow-hidden">
            <div className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white">Scottsdale Trip — March 2026</h3>
                <p className="text-xs text-zinc-500 mt-0.5">4 days · 4 players · 4 rounds</p>
              </div>
              <Link href="/login" className="rounded-lg bg-[#D94F2B]/10 px-3 py-1.5 text-xs font-medium text-[#D94F2B] hover:bg-[#D94F2B]/20 transition-colors">
                Create yours →
              </Link>
            </div>
            <div className="grid sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-zinc-800">
              {sampleItinerary.map((day) => (
                <div key={day.day} className="p-4">
                  <div className="flex items-baseline gap-2 mb-3">
                    <span className="text-lg font-bold text-white">{day.day}</span>
                    <span className="text-xs text-zinc-500">{day.date}</span>
                  </div>
                  <div className="space-y-2">
                    {day.items.map((item, i) => (
                      <p key={i} className="text-xs text-zinc-400 leading-relaxed">{item}</p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ SECTION 2: ROUND TRACKER / COMMISSIONER MODE ═══ */}
      <section className="px-6 py-20 bg-zinc-900/50">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold text-amber-400 uppercase tracking-widest mb-3">Commissioner Mode</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white">
              Track rounds. Settle bets. No arguments.
            </h2>
            <p className="mt-4 text-zinc-400 max-w-xl mx-auto">
              Set up skins, Nassau bets, track live scores, and know exactly who owes who — 
              before anyone &quot;forgets.&quot; Free forever.
            </p>
          </div>

          {/* Scorecard preview */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 overflow-hidden">
            <div className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white">TPC Scottsdale — Stadium Course</h3>
                <p className="text-xs text-zinc-500 mt-0.5">$5 Nassau · $5 Skins · 4 players</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-green-500/10 px-2.5 py-0.5 text-xs font-medium text-green-400">Live</span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800">
                    <th className="px-6 py-3 text-left font-medium text-zinc-500">Player</th>
                    <th className="px-4 py-3 text-center font-medium text-zinc-500">Front</th>
                    <th className="px-4 py-3 text-center font-medium text-zinc-500">Back</th>
                    <th className="px-4 py-3 text-center font-medium text-zinc-500">Total</th>
                    <th className="px-4 py-3 text-center font-medium text-zinc-500">Skins</th>
                    <th className="px-4 py-3 text-right font-medium text-zinc-500">Money</th>
                  </tr>
                </thead>
                <tbody>
                  {sampleScorecard.map((player, i) => (
                    <tr key={player.name} className={`border-b border-zinc-800/50 ${i === 0 ? "bg-[#D94F2B]/5" : ""}`}>
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2">
                          <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? "bg-[#D94F2B]/20 text-[#D94F2B]" : "bg-zinc-800 text-zinc-400"}`}>
                            {player.name[0]}
                          </div>
                          <span className="font-medium text-white">{player.name}</span>
                          {i === 0 && <span className="text-xs text-[#D94F2B]">👑</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center text-zinc-300">{player.front}</td>
                      <td className="px-4 py-3 text-center text-zinc-300">{player.back}</td>
                      <td className="px-4 py-3 text-center font-bold text-white">{player.total}</td>
                      <td className="px-4 py-3 text-center text-zinc-300">{player.skins}</td>
                      <td className={`px-4 py-3 text-right font-bold ${player.money.startsWith("+") ? "text-[#D94F2B]" : "text-red-400"}`}>
                        {player.money}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-4 border-t border-zinc-800 flex items-center justify-between">
              <p className="text-xs text-zinc-500">Commissioner: Grayson · Hole 18 · 3:47 PM</p>
              <Link href="/login" className="rounded-lg bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-400 hover:bg-amber-500/20 transition-colors">
                Track your round →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ SECTION 3: EXPENSE SPLITTING ═══ */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold text-[#D94F2B] uppercase tracking-widest mb-3">Expense Tracking</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white">
              &quot;I&apos;ll Venmo you later&quot; — and they never do.
            </h2>
            <p className="mt-4 text-zinc-400 max-w-xl mx-auto">
              Log every expense, auto-split the bill, and generate a settlement report 
              so nobody can play dumb.
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 overflow-hidden max-w-2xl mx-auto">
            <div className="border-b border-zinc-800 px-6 py-4">
              <h3 className="font-bold text-white">Trip Expenses — Scottsdale</h3>
              <p className="text-xs text-zinc-500 mt-0.5">Total: $3,120 · $780/person</p>
            </div>
            <div className="divide-y divide-zinc-800/50">
              {sampleExpenses.map((exp) => (
                <div key={exp.item} className="px-6 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white">{exp.item}</p>
                    <p className="text-xs text-zinc-500">Paid by {exp.by} · {exp.split}</p>
                  </div>
                  <span className="text-sm font-bold text-white">{exp.amount}</span>
                </div>
              ))}
            </div>
            <div className="px-6 py-4 border-t border-zinc-800 bg-zinc-800/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-zinc-400 uppercase">Settlement</p>
                  <p className="text-sm text-zinc-300 mt-1">Tyler owes Grayson <span className="font-bold text-[#D94F2B]">$185</span></p>
                  <p className="text-sm text-zinc-300">Jake owes Grayson <span className="font-bold text-[#D94F2B]">$95</span></p>
                </div>
                <Link href="/login" className="rounded-lg bg-[#D94F2B] px-4 py-2 text-xs font-bold text-white hover:bg-[#D94F2B] transition-colors">
                  Settle Up
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ HOW IT WORKS (simplified) ═══ */}
      <section className="px-6 py-20 bg-zinc-900/50">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-3xl font-bold text-white mb-16">
            60 seconds. That&apos;s it.
          </h2>
          <div className="grid sm:grid-cols-3 gap-8">
            {[
              { icon: Target, title: "Pick your play", desc: "Create a trip or track a round. One tap, one link." },
              { icon: Users, title: "Send one link", desc: "Your crew sees the plan, confirms, and locks in. No back-and-forth." },
              { icon: CheckCircle2, title: "Play and settle", desc: "Scores, skins, expenses — tracked live. Settle up on the 18th green." },
            ].map((step, i) => (
              <div key={step.title} className="text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#D94F2B]/10 mb-4">
                  <step.icon className="h-7 w-7 text-[#D94F2B]" />
                </div>
                <h3 className="font-bold text-white mb-2">{step.title}</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ PRICING ═══ */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white">Simple pricing. No surprises.</h2>
            <p className="mt-4 text-zinc-400">Commissioner Mode is free. Forever. Seriously.</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
            {/* Free tier */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-8">
              <div className="text-xs font-semibold text-amber-400 uppercase tracking-widest mb-2">Commissioner Mode</div>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-4xl font-extrabold text-white">$0</span>
                <span className="text-zinc-500">/forever</span>
              </div>
              <p className="text-sm text-zinc-400 mb-6">Track rounds, run skins games, settle bets. Invite unlimited players.</p>
              <ul className="space-y-3 mb-8">
                {["Scorecard tracking", "Skins games + Nassau bets", "Expense splitting", "Invite via link", "Settlement calculator"].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-zinc-300">
                    <CheckCircle2 className="h-4 w-4 text-[#D94F2B] shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/login" className="block w-full rounded-xl border border-zinc-700 py-3 text-center text-sm font-bold text-white hover:bg-zinc-800 transition-colors">
                Get Started Free
              </Link>
            </div>

            {/* Pro tier */}
            <div className="relative rounded-2xl border border-[#D94F2B]/30 bg-zinc-900 p-8">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#D94F2B] px-3 py-0.5 text-xs font-bold text-white">
                Most Popular
              </div>
              <div className="text-xs font-semibold text-[#D94F2B] uppercase tracking-widest mb-2">Nassau Pro</div>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-4xl font-extrabold text-white">$6.99</span>
                <span className="text-zinc-500">/month</span>
              </div>
              <p className="text-xs text-zinc-500 mb-4">or $49.99/year (save 40%)</p>
              <p className="text-sm text-zinc-400 mb-6">Everything in Commissioner Mode plus full trip planning tools.</p>
              <ul className="space-y-3 mb-8">
                {["Everything in Commissioner Mode", "AI trip ideation", "Itinerary builder", "Group coordination", "Trip recaps + sharing", "Destination guides"].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-zinc-300">
                    <CheckCircle2 className="h-4 w-4 text-[#D94F2B] shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/login" className="block w-full rounded-xl bg-[#D94F2B] py-3 text-center text-sm font-bold text-white hover:bg-[#D94F2B] transition-colors shadow-lg shadow-[#D94F2B]/20">
                Start 30-Day Free Trial
              </Link>
            </div>
          </div>

          <p className="text-center text-xs text-zinc-600 mt-6">
            Need a single trip? Grab a <span className="text-zinc-400">Per-Trip Pass for $4.99</span> — no subscription needed.
          </p>
        </div>
      </section>

      {/* ═══ FINAL CTA ═══ */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            Your crew is already planning<br />the next trip without you.
          </h2>
          <p className="mt-6 text-lg text-zinc-400">
            Be the one who sends the Nassau link. Be the legend.
          </p>
          <Link
            href="/login"
            className="group mt-10 inline-flex items-center gap-2 rounded-xl bg-[#D94F2B] px-10 py-4 text-base font-bold text-white shadow-lg shadow-[#D94F2B]/20 transition-all hover:bg-[#D94F2B] hover:shadow-[#D94F2B]/20 hover:-translate-y-0.5"
          >
            Create Your Free Account
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <p className="mt-4 text-xs text-zinc-600">No credit card required · 30 seconds to set up</p>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="border-t border-zinc-800 px-6 py-8">
        <div className="mx-auto max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-lg font-extrabold text-[#D94F2B] tracking-tight">Nassau</span>
            <span className="text-xs text-zinc-600">Plan trips. Track rounds. Settle bets.</span>
          </div>
          <div className="flex items-center gap-6 text-xs text-zinc-500">
            <Link href="/blog" className="hover:text-zinc-300 transition-colors">Blog</Link>
            <Link href="/explore" className="hover:text-zinc-300 transition-colors">Explore Destinations</Link>
            <a href="mailto:grayson@nassau.golf" className="hover:text-zinc-300 transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
