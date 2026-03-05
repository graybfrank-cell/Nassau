import { createServiceClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import Link from "next/link";
import type { Metadata } from "next";
import BlogArticleContent from "./BlogArticleContent";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ preview?: string }>;
}

async function getPost(slug: string, allowPreview: boolean) {
  const supabase = createServiceClient();

  if (allowPreview) {
    const { data } = await supabase
      .from("seo_blog_posts")
      .select("*")
      .eq("slug", slug)
      .neq("status", "deleted")
      .single();
    return data;
  }

  const { data } = await supabase
    .from("seo_blog_posts")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .single();
  return data;
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { slug } = await params;
  const sp = await searchParams;
  const post = await getPost(slug, sp.preview === "true");

  if (!post) return { title: "Not Found" };

  return {
    title: `${post.title} | Nassau`,
    description: post.meta_description,
    openGraph: {
      title: post.title,
      description: post.meta_description,
      url: `https://nassau.golf/blog/${post.slug}`,
      siteName: "Nassau",
      type: "article",
      publishedTime: post.published_at,
      authors: [post.author_name || "Grayson Frank"],
      images: post.featured_image_url ? [post.featured_image_url] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.meta_description,
      images: post.featured_image_url ? [post.featured_image_url] : [],
    },
    alternates: {
      canonical: `https://nassau.golf/blog/${post.slug}`,
    },
  };
}

export const revalidate = 3600;

export default async function BlogPostPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;
  const isPreview = sp.preview === "true";

  // For preview mode, verify admin via cookie presence
  let isAdmin = false;
  if (isPreview) {
    try {
      const cookieStore = await cookies();
      const supabaseCookies = cookieStore.getAll();
      isAdmin = supabaseCookies.some((c) => c.name.includes("auth-token"));
    } catch {
      // Not authenticated
    }
  }

  const post = await getPost(slug, isPreview && isAdmin);
  if (!post) notFound();

  // Increment page views (only for published, non-preview)
  if (!isPreview) {
    const supabase = createServiceClient();
    await supabase
      .from("seo_blog_posts")
      .update({ page_views: (post.page_views || 0) + 1 })
      .eq("id", post.id);
  }

  // Get related posts
  const supabase = createServiceClient();
  let relatedPosts: { id: string; title: string; slug: string; meta_description: string; featured_image_url: string | null; reading_time_minutes: number | null; word_count: number; tags: string[] | null }[] = [];
  if (post.tags && post.tags.length > 0) {
    const { data } = await supabase
      .from("seo_blog_posts")
      .select("id, title, slug, meta_description, featured_image_url, reading_time_minutes, word_count, tags")
      .eq("status", "published")
      .neq("id", post.id)
      .overlaps("tags", post.tags)
      .limit(3);
    relatedPosts = data || [];
  }
  if (relatedPosts.length === 0) {
    const { data } = await supabase
      .from("seo_blog_posts")
      .select("id, title, slug, meta_description, featured_image_url, reading_time_minutes, word_count, tags")
      .eq("status", "published")
      .neq("id", post.id)
      .order("published_at", { ascending: false })
      .limit(3);
    relatedPosts = data || [];
  }

  // Table of contents from H2 headings
  const tocItems: { text: string; id: string }[] = [];
  const h2Regex = /^##\s+(.+)$/gm;
  let match;
  while ((match = h2Regex.exec(post.content_markdown)) !== null) {
    const text = match[1].trim();
    const id = text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-");
    tocItems.push({ text, id });
  }

  const readingTime =
    post.reading_time_minutes || Math.ceil((post.word_count || 0) / 200);

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.meta_description,
    author: {
      "@type": "Person",
      name: post.author_name || "Grayson Frank",
    },
    publisher: {
      "@type": "Organization",
      name: "Nassau",
      url: "https://nassau.golf",
    },
    datePublished: post.published_at,
    dateModified: post.updated_at,
    image: post.featured_image_url || undefined,
    keywords: post.secondary_keywords?.join(", "),
    mainEntityOfPage: `https://nassau.golf/blog/${post.slug}`,
  };

  return (
    <div className="min-h-screen bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />

      {/* Preview banner */}
      {isPreview && (
        <div className="bg-amber-400 px-6 py-2 text-center text-sm font-semibold text-amber-900">
          Preview Mode — This post is not published yet.
        </div>
      )}

      {/* Nav */}
      <nav className="border-b border-zinc-200 bg-slate-900">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-xl font-extrabold tracking-tight text-emerald-400">
            Nassau
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/blog" className="text-sm font-medium text-zinc-300 hover:text-white transition-colors">
              Articles
            </Link>
            <Link href="/explore" className="text-sm font-medium text-zinc-300 hover:text-white transition-colors">
              Explore
            </Link>
            <Link href="/login" className="rounded-lg bg-emerald-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors">
              Sign In
            </Link>
          </div>
        </div>
      </nav>

      {/* Featured image hero */}
      {post.featured_image_url && (
        <div className="relative h-[400px] w-full overflow-hidden bg-slate-900 sm:h-[500px]">
          <img
            src={post.featured_image_url}
            alt={post.featured_image_alt || post.title}
            className="h-full w-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 mx-auto max-w-3xl px-6 pb-10">
            {post.tags?.[0] && (
              <span className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white">
                {post.tags[0]}
              </span>
            )}
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-5xl">
              {post.title}
            </h1>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-6xl px-6">
        <div className="relative grid grid-cols-1 gap-12 py-10 lg:grid-cols-[1fr_280px]">
          {/* Main content */}
          <div>
            {/* Header (if no featured image) */}
            {!post.featured_image_url && (
              <header className="mb-10">
                {post.tags?.[0] && (
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                    {post.tags[0]}
                  </span>
                )}
                <h1 className="mt-3 text-3xl font-bold tracking-tight text-zinc-900 sm:text-5xl">
                  {post.title}
                </h1>
              </header>
            )}

            {/* Author byline */}
            <div className="mb-10 flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">
                {(post.author_name || "G")[0]}
              </div>
              <div>
                <div className="text-sm font-semibold text-zinc-900">
                  {post.author_name || "Grayson Frank"}
                </div>
                <div className="flex items-center gap-2 text-xs text-zinc-400">
                  <span>{post.author_title || "Founder, Nassau"}</span>
                  <span>&bull;</span>
                  <span>
                    {new Date(post.published_at || post.created_at).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                  <span>&bull;</span>
                  <span>{readingTime} min read</span>
                </div>
              </div>
            </div>

            {/* Article body */}
            <BlogArticleContent markdown={post.content_markdown} />

            {/* End CTA */}
            <div className="mt-14 rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center sm:p-10">
              <h3 className="text-2xl font-bold text-zinc-900">
                Ready to plan your crew&apos;s next trip?
              </h3>
              <p className="mt-2 text-zinc-600">
                Nassau makes it easy to plan trips, track rounds, and settle bets — all in one place.
              </p>
              <Link
                href="/login"
                className="mt-5 inline-block rounded-lg bg-emerald-600 px-8 py-3 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors"
              >
                Start for free
              </Link>
            </div>

            {/* Related posts */}
            {relatedPosts.length > 0 && (
              <div className="mt-16">
                <h3 className="text-xl font-bold text-zinc-900 mb-6">More from Golf Trip Intel</h3>
                <div className="grid gap-6 sm:grid-cols-3">
                  {relatedPosts.map((rp) => (
                    <Link
                      key={rp.id}
                      href={`/blog/${rp.slug}`}
                      className="group overflow-hidden rounded-xl border border-zinc-200 transition-shadow hover:shadow-md"
                    >
                      {rp.featured_image_url ? (
                        <div className="aspect-video overflow-hidden bg-zinc-100">
                          <img src={rp.featured_image_url} alt={rp.title} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                        </div>
                      ) : (
                        <div className="flex aspect-video items-center justify-center bg-gradient-to-br from-emerald-800 to-slate-900">
                          <span className="text-3xl font-extrabold text-emerald-500/20">N</span>
                        </div>
                      )}
                      <div className="p-4">
                        <h4 className="text-sm font-semibold text-zinc-900 group-hover:text-emerald-700 transition-colors line-clamp-2">
                          {rp.title}
                        </h4>
                        <p className="mt-1 text-xs text-zinc-400">
                          {rp.reading_time_minutes || Math.ceil((rp.word_count || 0) / 200)} min read
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-10">
              <Link href="/blog" className="text-sm text-zinc-400 hover:text-zinc-600 transition-colors">
                &larr; All articles
              </Link>
            </div>
          </div>

          {/* Sidebar */}
          <aside className="hidden lg:block">
            <div className="sticky top-6 space-y-6">
              {tocItems.length > 0 && (
                <div className="rounded-xl border border-zinc-200 p-5">
                  <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
                    In this article
                  </h4>
                  <nav className="space-y-2">
                    {tocItems.map((item) => (
                      <a
                        key={item.id}
                        href={`#${item.id}`}
                        className="block text-sm text-zinc-600 hover:text-emerald-600 transition-colors"
                      >
                        {item.text}
                      </a>
                    ))}
                  </nav>
                </div>
              )}
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
                <h4 className="font-semibold text-zinc-900">Plan your golf trip</h4>
                <p className="mt-1 text-sm text-zinc-600">
                  Organize your crew, track rounds, and settle bets.
                </p>
                <Link
                  href="/login"
                  className="mt-4 block rounded-lg bg-emerald-600 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-emerald-700 transition-colors"
                >
                  Start for free
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
