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

      {/* ═══ PRICING ═══ */}
      <section className="bg-[#F2F0EB] px-6 py-24 lg:px-16">
        <div className="mx-auto max-w-6xl">
          <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#8A8A8A]">
            Pricing
          </p>
          <h2 className="mt-3 font-headline text-[36px] font-medium leading-tight tracking-tight text-[#111111] sm:text-[40px]">
            Pick your play
          </h2>

          <div className="mx-auto mt-14 grid max-w-4xl gap-8 md:grid-cols-2">
            {/* CARD 1 — PER-TRIP PASS (primary) */}
            <div className="flex flex-col rounded-2xl border border-[#111111]/10 bg-[#F2F0EB] p-10 shadow-sm">
              <div className="flex items-baseline gap-2">
                <span className="font-headline text-5xl font-medium text-[#111111]">
                  $9.99
                </span>
                <span className="text-sm text-[#8A8A8A]">one trip</span>
              </div>
              <p className="mt-4 text-sm font-medium text-[#111111]">
                Full Nassau features. One trip. No subscription.
              </p>
              <p className="mt-2 text-sm text-[#8A8A8A]">
                Build your trip free. Pay when you&apos;re ready to send it to
                the group.
              </p>
              <ul className="mt-6 space-y-3">
                <li className="flex items-start gap-3 text-sm text-[#111111]">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#2D5A3D]" />
                  One link to invite your whole group
                </li>
                <li className="flex items-start gap-3 text-sm text-[#111111]">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#2D5A3D]" />
                  Live coordination: date poll, itinerary, deposits
                </li>
                <li className="flex items-start gap-3 text-sm text-[#111111]">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#2D5A3D]" />
                  Scores, settlements, and recap
                </li>
              </ul>
              <Link
                href="/login?next=/trips/new"
                className="mt-auto block w-full rounded-full bg-[#2D5A3D] py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-[#244B33]"
                style={{ marginTop: "2.5rem" }}
              >
                Plan a trip →
              </Link>
            </div>

            {/* CARD 2 — FOUNDING MEMBER (distinct) */}
            <div className="flex flex-col rounded-2xl bg-[#111111] p-10 shadow-sm">
              <div className="flex items-baseline gap-2">
                <span className="font-headline text-5xl font-medium text-[#F2F0EB]">
                  $49.99
                </span>
                <span className="text-sm text-[#F2F0EB]/70">/ year, forever</span>
              </div>
              <p className="mt-4 text-sm font-medium text-[#C9A54E]">
                First 100 captains only.
              </p>
              <p className="mt-2 text-xs italic text-[#F2F0EB]/70">
                For personal use organizing trips with your own friends and
                group.
              </p>

              <div className="mt-6">
                <p className="mb-2 text-xs text-[#F2F0EB]/70">
                  12 of 100 claimed
                </p>
                <div className="h-1.5 overflow-hidden rounded-full bg-[#F2F0EB]/10">
                  <div
                    className="h-full rounded-full bg-[#C9A54E]"
                    style={{ width: "12%" }}
                  />
                </div>
              </div>

              <ul className="mt-6 space-y-3">
                <li className="flex items-start gap-3 text-sm text-[#F2F0EB]">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#C9A54E]" />
                  Unlimited trips, forever
                </li>
                <li className="flex items-start gap-3 text-sm text-[#F2F0EB]">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#C9A54E]" />
                  Lifetime price lock at $49.99/year
                </li>
                <li className="flex items-start gap-3 text-sm text-[#F2F0EB]">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#C9A54E]" />
                  Founding Member badge on your profile
                </li>
                <li className="flex items-start gap-3 text-sm text-[#F2F0EB]">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#C9A54E]" />
                  First access to the Nassau marketplace when it launches
                </li>
                <li className="flex items-start gap-3 text-sm text-[#F2F0EB]">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#C9A54E]" />
                  Direct founder access
                </li>
              </ul>
              <Link
                href="/founding"
                className="mt-auto block w-full rounded-full bg-[#C9A54E] py-3 text-center text-sm font-semibold text-[#111111] transition-opacity hover:opacity-90"
                style={{ marginTop: "2.5rem" }}
              >
                Join the 100 →
              </Link>
            </div>
          </div>

          {/* PARTNERSHIPS ROW */}
          <div className="mx-auto mt-20 max-w-4xl">
            <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#8A8A8A]">
              Partnerships
            </p>
            <h3 className="mt-3 font-headline text-[28px] font-medium leading-tight tracking-tight text-[#111111] sm:text-[32px]">
              Running trips commercially?
            </h3>
            <p className="mt-3 max-w-2xl text-base text-[#111111]/70">
              Agencies, creators, concierges, and resort teams use Nassau as
              their operating layer.
            </p>
            <Link
              href="/partnerships"
              className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[#2D5A3D] hover:text-[#244B33]"
            >
              Talk to us →
            </Link>
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
