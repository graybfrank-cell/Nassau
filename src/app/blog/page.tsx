import { createServiceClient } from "@/lib/supabase/admin";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Golf Trip Guides & Articles | Nassau",
  description:
    "Golf trip planning guides, Nassau bet rules, skins game formats, and destination intel from the team behind nassau.golf.",
  openGraph: {
    title: "Golf Trip Intel | Nassau",
    description:
      "Golf trip planning guides, Nassau bet rules, skins game formats, and destination intel.",
    url: "https://nassau.golf/blog",
    siteName: "Nassau",
    type: "website",
  },
};

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  meta_description: string;
  target_keyword: string;
  tags: string[] | null;
  word_count: number;
  reading_time_minutes: number | null;
  featured_image_url: string | null;
  featured_image_alt: string | null;
  author_name: string | null;
  published_at: string;
}

export const revalidate = 3600;

export default async function BlogIndex() {
  const supabase = createServiceClient();

  const { data: posts } = await supabase
    .from("seo_blog_posts")
    .select(
      "id, title, slug, meta_description, target_keyword, tags, word_count, reading_time_minutes, featured_image_url, featured_image_alt, author_name, published_at"
    )
    .eq("status", "published")
    .order("published_at", { ascending: false });

  const featured = posts?.[0] || null;
  const rest = posts?.slice(1) || [];

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-cream/[0.08] bg-[#111111]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link
            href="/"
            className="text-xl font-extrabold tracking-tight text-[#2D5A3D]"
          >
            Nassau
          </Link>
          <div className="flex items-center gap-6">
            <Link
              href="/blog"
              className="text-sm font-medium text-white"
            >
              Articles
            </Link>
            <Link
              href="/explore"
              className="text-sm font-medium text-zinc-300 hover:text-white transition-colors"
            >
              Explore Destinations
            </Link>
            <Link
              href="/login"
              className="rounded-lg bg-coral px-4 py-1.5 text-sm font-semibold text-white hover:bg-coral/90 transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero header */}
      <section className="bg-[#111111] px-6 py-16 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
          Golf Trip Intel
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-zinc-400">
          Trip planning guides, game formats, and golf culture from the Nassau
          crew.
        </p>
      </section>

      <main className="mx-auto max-w-6xl px-6 py-12">
        {!posts || posts.length === 0 ? (
          <div className="py-20 text-center text-zinc-400">
            <p className="text-lg">No articles yet. Check back soon.</p>
          </div>
        ) : (
          <>
            {/* Featured post */}
            {featured && (
              <Link
                href={`/blog/${featured.slug}`}
                className="group mb-12 block overflow-hidden rounded-2xl border border-zinc-200 transition-shadow hover:shadow-lg"
              >
                <div className="text-xs font-medium text-[#2D5A3D] uppercase tracking-wider">
                  {featured.target_keyword}
                </div>
                <h2 className="mt-2 text-lg font-semibold text-zinc-900 group-hover:text-[#2D5A3D] transition-colors line-clamp-2">
                  {featured.title}
                </h2>
                <p className="mt-2 text-sm text-zinc-500 line-clamp-3">
                  {featured.meta_description}
                </p>
                <div className="mt-4 flex items-center gap-3 text-xs text-zinc-400">
                  <span>{featured.word_count} words</span>
                  <span>&bull;</span>
                  <span>
                    {new Date(featured.published_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </Link>
            )}

            {/* Post grid */}
            {rest.length > 0 && (
              <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {rest.map((post: BlogPost) => (
                  <Link
                    key={post.id}
                    href={`/blog/${post.slug}`}
                    className="group overflow-hidden rounded-xl border border-zinc-200 bg-white transition-shadow hover:shadow-md"
                  >
                    {post.featured_image_url ? (
                      <div className="aspect-video overflow-hidden bg-zinc-100">
                        <img
                          src={post.featured_image_url}
                          alt={post.featured_image_alt || post.title}
                          className="h-full w-full object-cover transition-transform group-hover:scale-105"
                        />
                      </div>
                    ) : (
                      <div className="flex aspect-video items-center justify-center bg-[#2F4F4F]">
                        <span className="text-4xl font-extrabold text-teal/20">
                          N
                        </span>
                      </div>
                    )}
                    <div className="p-5">
                      {post.tags?.[0] && (
                        <span className="rounded-full bg-coral/10 px-2.5 py-0.5 text-xs font-medium text-coral">
                          {post.tags[0]}
                        </span>
                      )}
                      <h3 className="mt-2 text-lg font-semibold text-zinc-900 group-hover:text-coral transition-colors line-clamp-2">
                        {post.title}
                      </h3>
                      <p className="mt-2 text-sm text-zinc-500 line-clamp-2">
                        {post.meta_description}
                      </p>
                      <div className="mt-3 flex items-center gap-3 text-xs text-zinc-400">
                        <span>
                          {post.reading_time_minutes ||
                            Math.ceil((post.word_count || 0) / 200)}{" "}
                          min read
                        </span>
                        <span>&bull;</span>
                        <span>
                          {new Date(post.published_at).toLocaleDateString(
                            "en-US",
                            { month: "short", day: "numeric", year: "numeric" }
                          )}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer CTA */}
      <section className="border-t border-zinc-200 bg-zinc-50 px-6 py-12 text-center">
        <p className="text-zinc-500">
          Plan your next golf trip &rarr;{" "}
          <Link
            href="/"
            className="font-semibold text-coral hover:text-coral/90"
          >
            nassau.golf
          </Link>
        </p>
      </section>
    </div>
  );
}
