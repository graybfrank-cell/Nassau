import { createServiceClient } from "@/lib/supabase/admin";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Golf Trip Planning Blog | Nassau",
  description:
    "Expert guides on golf trip planning, course reviews, betting games, and destination breakdowns. Plan your next golf trip with Nassau.",
  openGraph: {
    title: "Golf Trip Planning Blog | Nassau",
    description:
      "Expert guides on golf trip planning, course reviews, and destination breakdowns.",
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
  word_count: number;
  published_at: string;
}

export const revalidate = 3600; // revalidate every hour

export default async function BlogIndex() {
  const supabase = createServiceClient();

  const { data: posts } = await supabase
    .from("seo_blog_posts")
    .select("id, title, slug, meta_description, target_keyword, word_count, published_at")
    .eq("status", "published")
    .order("published_at", { ascending: false });

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-zinc-200 bg-slate-900">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link
            href="/"
            className="text-xl font-extrabold tracking-tight text-[#D94F2B]"
          >
            Nassau
          </Link>
          <Link
            href="/explore"
            className="text-sm font-medium text-zinc-300 hover:text-white transition-colors"
          >
            Explore Destinations
          </Link>
        </div>
      </nav>

      <main className="mx-auto max-w-5xl px-6 py-12">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
          Golf Trip Planning Blog
        </h1>
        <p className="mt-2 text-lg text-zinc-500">
          Guides, tips, and insider knowledge for planning the perfect golf trip
          with your crew.
        </p>

        {(!posts || posts.length === 0) ? (
          <div className="mt-12 text-center text-zinc-400">
            <p>No posts yet. Check back soon.</p>
          </div>
        ) : (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post: BlogPost) => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="group rounded-xl border border-zinc-200 bg-white p-6 transition-shadow hover:shadow-md"
              >
                <div className="text-xs font-medium text-[#D94F2B] uppercase tracking-wider">
                  {post.target_keyword}
                </div>
                <h2 className="mt-2 text-lg font-semibold text-zinc-900 group-hover:text-[#D94F2B] transition-colors line-clamp-2">
                  {post.title}
                </h2>
                <p className="mt-2 text-sm text-zinc-500 line-clamp-3">
                  {post.meta_description}
                </p>
                <div className="mt-4 flex items-center gap-3 text-xs text-zinc-400">
                  <span>{post.word_count} words</span>
                  <span>&bull;</span>
                  <span>
                    {new Date(post.published_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
