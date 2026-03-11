import { createServiceClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = createServiceClient();

  const { data: post } = await supabase
    .from("seo_blog_posts")
    .select("title, meta_description, slug, published_at")
    .eq("slug", slug)
    .eq("status", "published")
    .single();

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
  const supabase = createServiceClient();

  const { data: post } = await supabase
    .from("seo_blog_posts")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (!post) notFound();

  // Increment page views
  await supabase
    .from("seo_blog_posts")
    .update({ page_views: (post.page_views || 0) + 1 })
    .eq("id", post.id);

  const contentHtml = markdownToHtml(post.content_markdown);

  // Article schema markup
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.meta_description,
    datePublished: post.published_at,
    dateModified: post.updated_at,
    author: {
      "@type": "Organization",
      name: "Nassau",
      url: "https://nassau.golf",
    },
    publisher: {
      "@type": "Organization",
      name: "Nassau",
      url: "https://nassau.golf",
    },
    mainEntityOfPage: `https://nassau.golf/blog/${post.slug}`,
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Schema markup */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />

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
            <Link
              href="/blog"
              className="text-sm font-medium text-zinc-300 hover:text-white transition-colors"
            >
              Blog
            </Link>
            <Link
              href="/explore"
              className="text-sm font-medium text-zinc-300 hover:text-white transition-colors"
            >
              Explore Destinations
            </Link>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-3xl px-6 py-12">
        {/* Breadcrumb */}
        <div className="mb-6 flex items-center gap-2 text-sm text-zinc-400">
          <Link href="/blog" className="hover:text-zinc-600">
            Blog
          </Link>
          <span>/</span>
          <span className="text-zinc-600 truncate">{post.title}</span>
        </div>

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

        {/* Back link */}
        <div className="mt-8">
          <Link
            href="/blog"
            className="text-sm text-zinc-400 hover:text-zinc-600 transition-colors"
          >
            &larr; Back to all posts
          </Link>
        </div>
      </main>
    </div>
  );
}
