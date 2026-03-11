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

// Simple Markdown to HTML converter (no external dependency needed)
function markdownToHtml(md: string): string {
  let html = md
    // Code blocks
    .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code class="language-$1">$2</code></pre>')
    // Headers
    .replace(/^######\s+(.+)$/gm, '<h6>$1</h6>')
    .replace(/^#####\s+(.+)$/gm, '<h5>$1</h5>')
    .replace(/^####\s+(.+)$/gm, '<h4>$1</h4>')
    .replace(/^###\s+(.+)$/gm, '<h3>$1</h3>')
    .replace(/^##\s+(.+)$/gm, '<h2>$1</h2>')
    .replace(/^#\s+(.+)$/gm, '<h1>$1</h1>')
    // Bold and italic
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-[#D94F2B] hover:text-[#D94F2B] underline">$1</a>')
    // Unordered lists
    .replace(/^[-*]\s+(.+)$/gm, '<li>$1</li>')
    // Ordered lists
    .replace(/^\d+\.\s+(.+)$/gm, '<li>$1</li>')
    // Horizontal rules
    .replace(/^---$/gm, '<hr class="my-8 border-zinc-200">')
    // Paragraphs (lines not already wrapped in tags)
    .replace(/^(?!<[a-z])((?!^\s*$).+)$/gm, '<p>$1</p>')
    // Clean up empty paragraphs
    .replace(/<p>\s*<\/p>/g, '');

  // Wrap consecutive <li> elements in <ul>
  html = html.replace(/((?:<li>.*?<\/li>\s*)+)/g, '<ul class="list-disc pl-6 space-y-1">$1</ul>');

  return html;
}

export default async function BlogPost({ params }: Props) {
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
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link
            href="/"
            className="text-xl font-extrabold tracking-tight text-[#D94F2B]"
          >
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

        {/* Header */}
        <header className="mb-10">
          <div className="text-xs font-medium text-[#D94F2B] uppercase tracking-wider">
            {post.target_keyword}
          </div>
          <h1 className="mt-2 text-4xl font-bold tracking-tight text-zinc-900">
            {post.title}
          </h1>
          <div className="mt-4 flex items-center gap-4 text-sm text-zinc-400">
            <span>
              {new Date(post.published_at).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </span>
            <span>&bull;</span>
            <span>{Math.ceil((post.word_count || 0) / 250)} min read</span>
          </div>
        </header>

        {/* Content */}
        <article
          className="prose prose-zinc prose-lg max-w-none prose-headings:font-bold prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4 prose-p:leading-relaxed prose-a:text-[#D94F2B] prose-a:no-underline hover:prose-a:underline prose-li:leading-relaxed"
          dangerouslySetInnerHTML={{ __html: contentHtml }}
        />

        {/* CTA */}
        <div className="mt-12 rounded-xl border border-emerald-200 bg-emerald-50 p-8 text-center">
          <h3 className="text-xl font-bold text-zinc-900">
            Ready to plan your golf trip?
          </h3>
          <p className="mt-2 text-zinc-600">
            Nassau makes it easy to plan trips, track rounds, and settle bets
            with your crew.
          </p>
          <Link
            href="/trips/new"
            className="mt-4 inline-block rounded-lg bg-[#D94F2B] px-6 py-3 text-sm font-semibold text-white hover:bg-[#B83D25] transition-colors"
          >
            Start planning your trip
          </Link>
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
