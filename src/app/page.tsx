import { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import AuthRedirect from "./auth-redirect";
import { createServiceClient } from "@/lib/supabase/admin";

import HeroSection from "@/components/landing/HeroSection";
import HowItWorks from "@/components/landing/HowItWorks";
import DestinationsSection from "@/components/landing/DestinationsSection";
import BetsSection from "@/components/landing/BetsSection";
import CTASection from "@/components/landing/CTASection";

export const metadata: Metadata = {
  title: "Nassau",
  description:
    "Run the trip. Plan it. Play it. Settle it. Nassau is the operating system for golf trips. Join the waitlist.",
  openGraph: {
    title: "Nassau — Run the trip.",
    description:
      "Run the trip. Plan it. Play it. Settle it. Nassau is the operating system for golf trips.",
    url: "https://nassau.golf",
    siteName: "Nassau",
    type: "website",
    images: ["/og-image.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Nassau — Run the trip.",
    description:
      "Run the trip. Plan it. Play it. Settle it. Join the waitlist.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: "https://nassau.golf",
  },
};

/* ─── RecentArticles ─── */

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

function OrganizationJsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Nassau",
    url: "https://nassau.golf",
    logo: "https://nassau.golf/og-image.png",
    description:
      "Run the trip. The operating system for golf trips. Plan it. Play it. Settle it.",
    sameAs: ["https://x.com/UseNassauGolf"],
    contactPoint: {
      "@type": "ContactPoint",
      email: "hello@nassau.golf",
      contactType: "customer support",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export default async function Home() {
  return (
    <div className="relative">
      <OrganizationJsonLd />
      <AuthRedirect />

      <HeroSection />

      {/* Transition */}
      <div className="h-24 bg-gradient-to-b from-[#111111] to-[#F2F0EB]" />

      <HowItWorks />
      <DestinationsSection />

      <BetsSection />

      {/* ═══ PRICING & FOUNDING MEMBERS ═══ */}
      <section className="bg-[#F2F0EB] px-6 py-24 lg:px-16">
        <div className="mx-auto max-w-6xl">
          <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#8A8A8A]">
            Pricing
          </p>
          <h2 className="mt-3 font-headline text-[36px] font-medium leading-tight tracking-tight text-[#111111] sm:text-[40px]">
            Pick your play
          </h2>
          <div className="mx-auto mt-14 grid max-w-4xl gap-8 md:grid-cols-2">
            {/* Founding Members card */}
            <div className="rounded-2xl bg-white p-10 shadow-sm">
              <h3 className="font-headline text-2xl font-medium text-[#111111]">
                Founding Members
              </h3>
              <p className="mt-4 text-sm text-[#8A8A8A]">
                88 founding member spots remaining. Lock in $49.99/yr — the
                price never goes up.
              </p>
              <div className="mt-6 mb-6">
                <span className="text-4xl font-semibold text-[#111111]">$49.99</span>
                <span className="text-sm text-[#8A8A8A]">/year</span>
                <span className="mt-1 block text-sm text-[#8A8A8A]">
                  Lock in this rate forever.
                </span>
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
                href="/login?next=/trips/new"
                className="mt-6 block w-full rounded-full bg-[#2D5A3D] py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-[#244B33]"
              >
                Join waitlist
              </Link>
            </div>

            {/* Pricing tiers card */}
            <div className="rounded-2xl bg-white p-10 shadow-sm">
              <h3 className="text-xl font-semibold text-[#111111]">
                Free to keep score.
              </h3>
              <p className="mt-1 mb-8 text-sm text-[#8A8A8A]">
                Pay when money&apos;s on the line.
              </p>

              {/* Commissioner */}
              <div className="mb-3 rounded-xl bg-[#F2F0EB] p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold uppercase text-[#111111]">
                    Commissioner
                  </span>
                  <span className="font-semibold text-[#111111]">$0 forever</span>
                </div>
                <div className="mt-2 space-y-1">
                  <p className="text-xs text-[#8A8A8A]">Score rounds, basic skins tracking</p>
                  <p className="text-xs text-[#8A8A8A]">Shareable recap link</p>
                  <p className="text-xs text-[#8A8A8A]">No bet tracking, no trips</p>
                </div>
              </div>

              {/* Nassau Pro */}
              <div className="mb-3 rounded-xl border border-[#2D5A3D] bg-[#F2F0EB] p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold uppercase text-[#2D5A3D]">
                    Nassau Pro
                  </span>
                  <span className="font-semibold text-[#111111]">$6.99/mo</span>
                </div>
                <div className="mt-2 space-y-1">
                  <p className="text-xs text-[#8A8A8A]">Bet tracking + settlements</p>
                  <p className="text-xs text-[#8A8A8A]">Trip planning + expenses</p>
                  <p className="text-xs text-[#8A8A8A]">Live scorecard</p>
                </div>
              </div>

              {/* Founding Member */}
              <div className="mb-3 rounded-xl border-2 border-[#B8976A] bg-[#111111] p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold uppercase text-[#B8976A]">
                    Founding Member
                  </span>
                  <div className="flex items-center">
                    <span className="font-semibold text-[#F2F0EB]">$49.99/yr</span>
                    <span className="ml-2 rounded bg-[#B8976A] px-2 py-0.5 text-xs font-semibold uppercase text-white">
                      Limited
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
                href="/login?next=/trips/new"
                className="mt-4 block w-full rounded-full bg-[#2D5A3D] py-3 text-center text-sm font-semibold text-white"
              >
                Join waitlist
              </Link>
              <Link
                href="/login?next=/trips/new"
                className="mt-2 block w-full rounded-full bg-[#B8976A] py-3 text-center text-sm font-semibold text-white"
              >
                Join waitlist — Founding spots available
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ RECENT ARTICLES ═══ */}
      <section className="bg-[#F2F0EB] px-6 py-16 lg:px-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-8 font-headline text-[28px] font-medium tracking-tight text-[#111111]">
            Latest from the blog
          </h2>
          <RecentArticles />
        </div>
      </section>

      <CTASection />
    </div>
  );
}
