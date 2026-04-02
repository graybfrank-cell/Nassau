import Link from "next/link";
import Image from "next/image";

export default function HeroSection() {
  return (
    <section className="relative flex min-h-screen flex-col overflow-hidden">
      {/* Background image */}
      <Image
        src="https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?q=80&w=2070&auto=format&fit=crop"
        alt="Golf course at dawn"
        fill
        priority
        className="object-cover"
      />
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/70" />

      {/* Top bar */}
      <nav className="relative z-20 flex items-center justify-between px-6 py-5 lg:px-12">
        <span className="font-headline text-[20px] font-medium text-white">
          Nassau
        </span>
        <div className="hidden items-center gap-8 md:flex">
          <Link href="/explore" className="text-sm text-white/70 transition-colors hover:text-white">
            Trips
          </Link>
          <Link href="/explore" className="text-sm text-white/70 transition-colors hover:text-white">
            Explore
          </Link>
          <Link href="/pricing" className="text-sm text-white/70 transition-colors hover:text-white">
            Pricing
          </Link>
        </div>
        <Link
          href="/login"
          className="rounded-full border border-white/30 px-5 py-2 text-sm text-white transition-colors hover:bg-white/10"
        >
          Get started
        </Link>
      </nav>

      {/* Frosted glass card — top right */}
      <div className="absolute right-6 top-20 z-20 hidden rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur-md lg:right-12 lg:top-24 lg:block">
        <p className="text-xs font-medium uppercase tracking-wider text-white/60">
          Founding members
        </p>
        <p className="mt-1 text-sm font-semibold text-white">
          88 spots &middot; $49.99/yr locked forever
        </p>
        <Link
          href="/founding"
          className="mt-3 inline-block text-xs font-medium text-[#2D5A3D] transition-colors hover:text-[#3a7a52]"
        >
          Claim your spot &rarr;
        </Link>
      </div>

      {/* Hero content — bottom left */}
      <div className="relative z-10 mt-auto px-6 pb-24 lg:px-12">
        <h1 className="font-headline text-[48px] font-medium leading-[1.05] text-white sm:text-[64px]">
          Your golf trip,
          <br />
          handled.
        </h1>
        <p className="mt-4 max-w-md text-[16px] leading-relaxed text-white/60">
          The operating system for golf trips. From the first group text to the
          last settlement &mdash; one app.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <Link
            href="/login"
            className="rounded-full bg-white px-8 py-3 text-sm font-semibold text-[#111111] transition-colors hover:bg-white/90"
          >
            Plan a trip
          </Link>
          <Link
            href="/explore"
            className="text-sm text-white/60 transition-colors hover:text-white"
          >
            Explore destinations
          </Link>
        </div>
      </div>
    </section>
  );
}
