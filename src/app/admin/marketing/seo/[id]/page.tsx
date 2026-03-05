"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import PhotoSearchPanel from "@/components/admin/PhotoSearchPanel";
import {
  ArrowLeft,
  Save,
  Eye,
  Globe,
  Loader2,
  ExternalLink,
  ImagePlus,
  X,
  Check,
} from "lucide-react";

const ADMIN_EMAIL = "graybfrank@gmail.com";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Post = any;

export default function PostEditor() {
  const router = useRouter();
  const params = useParams();
  const postId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [post, setPost] = useState<Post>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [showPhotoPanel, setShowPhotoPanel] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auth check
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user || user.email !== ADMIN_EMAIL) {
        router.push("/dashboard");
      }
    });
  }, [router]);

  // Fetch post
  const fetchPost = useCallback(async () => {
    const res = await fetch(`/api/admin/seo/${postId}`);
    if (res.ok) {
      const data = await res.json();
      setPost(data.post);
    }
    setLoading(false);
  }, [postId]);

  useEffect(() => {
    fetchPost();
  }, [fetchPost]);

  // Save post
  async function savePost(overrides?: Partial<Post>) {
    setSaving(true);
    setSaved(false);
    const body = { ...post, ...overrides };
    const res = await fetch(`/api/admin/seo/${postId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      const data = await res.json();
      setPost(data.post);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
    setSaving(false);
  }

  // Publish post
  async function publishPost() {
    await savePost({ status: "published" });
  }

  // Insert photo markdown at cursor position
  function insertPhotoAtCursor(url: string, alt: string, photographer: string, photographerUrl: string) {
    const ta = textareaRef.current;
    if (!ta) return;

    const photoMarkdown = `\n![${alt}](${url})\n*Photo: [${photographer}](${photographerUrl}) / [Unsplash](https://unsplash.com)*\n`;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const text = post.content_markdown || "";
    const newText = text.slice(0, start) + photoMarkdown + text.slice(end);

    setPost({ ...post, content_markdown: newText });

    // Restore cursor position after state update
    setTimeout(() => {
      ta.focus();
      const newPos = start + photoMarkdown.length;
      ta.setSelectionRange(newPos, newPos);
    }, 0);
  }

  // Live word count
  const wordCount = (post?.content_markdown || "")
    .replace(/[#*_\[\]()!]/g, "")
    .split(/\s+/)
    .filter(Boolean).length;

  const readingTime = Math.ceil(wordCount / 200);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-zinc-400">Post not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Top bar */}
      <div className="sticky top-0 z-30 border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/admin/marketing")}
              className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <h1 className="text-sm font-semibold text-zinc-900">
                Post Editor
              </h1>
              <span
                className={`text-xs font-medium ${
                  post.status === "published"
                    ? "text-emerald-600"
                    : post.status === "review"
                      ? "text-amber-600"
                      : "text-zinc-400"
                }`}
              >
                {post.status}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {saved && (
              <span className="flex items-center gap-1 text-xs text-emerald-600">
                <Check className="h-3.5 w-3.5" /> Saved
              </span>
            )}
            <button
              onClick={() => savePost()}
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Save className="h-3.5 w-3.5" />
              )}
              Save Draft
            </button>
            {post.slug && (
              <a
                href={`/blog/${post.slug}?preview=true`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
              >
                <Eye className="h-3.5 w-3.5" />
                Preview
              </a>
            )}
            {post.status !== "published" ? (
              <button
                onClick={publishPost}
                disabled={saving}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                <Globe className="h-3.5 w-3.5" />
                Publish
              </button>
            ) : (
              <a
                href={`/blog/${post.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                View Live
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="mx-auto max-w-7xl px-6 py-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          {/* Left column — Editor (60%) */}
          <div className="lg:col-span-3 space-y-4">
            {/* Title */}
            <input
              type="text"
              value={post.title || ""}
              onChange={(e) => setPost({ ...post, title: e.target.value })}
              placeholder="Post title..."
              className="w-full text-3xl font-bold text-zinc-900 placeholder:text-zinc-300 bg-transparent border-none outline-none focus:ring-0"
            />

            {/* Meta description */}
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1">
                Meta Description{" "}
                <span
                  className={`${
                    (post.meta_description?.length || 0) >= 150 &&
                    (post.meta_description?.length || 0) <= 160
                      ? "text-emerald-600"
                      : "text-zinc-400"
                  }`}
                >
                  ({post.meta_description?.length || 0}/160)
                </span>
              </label>
              <textarea
                value={post.meta_description || ""}
                onChange={(e) =>
                  setPost({ ...post, meta_description: e.target.value })
                }
                placeholder="Compelling description for search results..."
                rows={2}
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            {/* Keywords + Tags */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">
                  Target Keyword
                </label>
                <input
                  type="text"
                  value={post.target_keyword || ""}
                  onChange={(e) =>
                    setPost({ ...post, target_keyword: e.target.value })
                  }
                  placeholder="Primary keyword"
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">
                  Secondary Keywords (comma-separated)
                </label>
                <input
                  type="text"
                  value={(post.secondary_keywords || []).join(", ")}
                  onChange={(e) =>
                    setPost({
                      ...post,
                      secondary_keywords: e.target.value
                        .split(",")
                        .map((s: string) => s.trim())
                        .filter(Boolean),
                    })
                  }
                  placeholder="keyword 1, keyword 2"
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={(post.tags || []).join(", ")}
                  onChange={(e) =>
                    setPost({
                      ...post,
                      tags: e.target.value
                        .split(",")
                        .map((s: string) => s.trim())
                        .filter(Boolean),
                    })
                  }
                  placeholder="scottsdale, trip guide, arizona"
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1">
                    Author
                  </label>
                  <input
                    type="text"
                    value={post.author_name || "Grayson Frank"}
                    onChange={(e) =>
                      setPost({ ...post, author_name: e.target.value })
                    }
                    className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1">
                    Author Title
                  </label>
                  <input
                    type="text"
                    value={post.author_title || "Founder, Nassau"}
                    onChange={(e) =>
                      setPost({ ...post, author_title: e.target.value })
                    }
                    className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>
            </div>

            {/* Markdown editor */}
            <div className="rounded-lg border border-zinc-200 bg-white">
              {/* Editor toolbar */}
              <div className="flex items-center justify-between border-b border-zinc-200 px-3 py-2">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPreviewMode(false)}
                    className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
                      !previewMode
                        ? "bg-zinc-900 text-white"
                        : "text-zinc-500 hover:text-zinc-700"
                    }`}
                  >
                    Write
                  </button>
                  <button
                    onClick={() => setPreviewMode(true)}
                    className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
                      previewMode
                        ? "bg-zinc-900 text-white"
                        : "text-zinc-500 hover:text-zinc-700"
                    }`}
                  >
                    Preview
                  </button>
                </div>
                <button
                  onClick={() => setShowPhotoPanel(!showPhotoPanel)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50"
                >
                  <ImagePlus className="h-3.5 w-3.5" />
                  Insert Photo
                </button>
              </div>

              {/* Photo panel */}
              {showPhotoPanel && (
                <div className="border-b border-zinc-200 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-zinc-500">
                      Photo Search
                    </span>
                    <button
                      onClick={() => setShowPhotoPanel(false)}
                      className="text-zinc-400 hover:text-zinc-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <PhotoSearchPanel
                    onInsert={(url, alt, photographer, photographerUrl) => {
                      insertPhotoAtCursor(url, alt, photographer, photographerUrl);
                      setShowPhotoPanel(false);
                    }}
                    onSetFeatured={(url, alt) => {
                      setPost({
                        ...post,
                        featured_image_url: url,
                        featured_image_alt: alt,
                      });
                      setShowPhotoPanel(false);
                    }}
                  />
                </div>
              )}

              {/* Editor / Preview */}
              {previewMode ? (
                <div className="p-6 min-h-[500px] article-body">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      h2: ({ children }) => (
                        <h2 className="text-[1.75rem] font-bold mt-10 mb-4 text-zinc-900">
                          {children}
                        </h2>
                      ),
                      h3: ({ children }) => (
                        <h3 className="text-[1.35rem] font-semibold mt-8 mb-3 text-zinc-800">
                          {children}
                        </h3>
                      ),
                      p: ({ children }) => (
                        <p className="text-lg leading-[1.8] text-zinc-700 mb-6">
                          {children}
                        </p>
                      ),
                      a: ({ href, children }) => (
                        <a
                          href={href}
                          className="text-emerald-600 underline hover:text-emerald-700"
                        >
                          {children}
                        </a>
                      ),
                      img: ({ src, alt }) => (
                        <img
                          src={src}
                          alt={alt || ""}
                          className="rounded-xl my-8 w-full"
                        />
                      ),
                      ul: ({ children }) => (
                        <ul className="text-lg leading-[1.8] text-zinc-700 mb-6 pl-6 list-disc">
                          {children}
                        </ul>
                      ),
                      ol: ({ children }) => (
                        <ol className="text-lg leading-[1.8] text-zinc-700 mb-6 pl-6 list-decimal">
                          {children}
                        </ol>
                      ),
                      blockquote: ({ children }) => (
                        <blockquote className="border-l-4 border-emerald-500 pl-6 italic text-zinc-500 my-8">
                          {children}
                        </blockquote>
                      ),
                      strong: ({ children }) => (
                        <strong className="text-zinc-900">{children}</strong>
                      ),
                    }}
                  >
                    {post.content_markdown || ""}
                  </ReactMarkdown>
                </div>
              ) : (
                <textarea
                  ref={textareaRef}
                  value={post.content_markdown || ""}
                  onChange={(e) =>
                    setPost({ ...post, content_markdown: e.target.value })
                  }
                  placeholder="Write your article in Markdown..."
                  className="w-full min-h-[500px] p-6 text-sm font-mono text-zinc-900 placeholder:text-zinc-400 border-none outline-none resize-y focus:ring-0"
                />
              )}
            </div>
          </div>

          {/* Right column — Metadata & Actions (40%) */}
          <div className="lg:col-span-2 space-y-4">
            {/* Featured Image */}
            <div className="rounded-lg border border-zinc-200 bg-white p-4">
              <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
                Featured Image
              </h4>
              {post.featured_image_url ? (
                <div className="space-y-2">
                  <img
                    src={post.featured_image_url}
                    alt={post.featured_image_alt || "Featured image"}
                    className="w-full rounded-lg object-cover aspect-video"
                  />
                  <input
                    type="text"
                    value={post.featured_image_alt || ""}
                    onChange={(e) =>
                      setPost({ ...post, featured_image_alt: e.target.value })
                    }
                    placeholder="Alt text for image..."
                    className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-500 focus:outline-none"
                  />
                  <button
                    onClick={() =>
                      setPost({
                        ...post,
                        featured_image_url: null,
                        featured_image_alt: null,
                      })
                    }
                    className="text-xs text-red-500 hover:text-red-600"
                  >
                    Remove image
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={post.featured_image_url || ""}
                    onChange={(e) =>
                      setPost({ ...post, featured_image_url: e.target.value })
                    }
                    placeholder="Paste image URL or use photo search..."
                    className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-500 focus:outline-none"
                  />
                  <button
                    onClick={() => setShowPhotoPanel(true)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50 w-full justify-center"
                  >
                    <ImagePlus className="h-3.5 w-3.5" />
                    Search Photos
                  </button>
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="rounded-lg border border-zinc-200 bg-white p-4">
              <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
                Post Stats
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-zinc-50 p-3">
                  <div className="text-lg font-bold text-zinc-900">
                    {wordCount.toLocaleString()}
                  </div>
                  <div className="text-xs text-zinc-500">Words</div>
                </div>
                <div className="rounded-lg bg-zinc-50 p-3">
                  <div className="text-lg font-bold text-zinc-900">
                    {readingTime} min
                  </div>
                  <div className="text-xs text-zinc-500">Read time</div>
                </div>
                {post.page_views > 0 && (
                  <div className="rounded-lg bg-zinc-50 p-3">
                    <div className="text-lg font-bold text-zinc-900">
                      {post.page_views.toLocaleString()}
                    </div>
                    <div className="text-xs text-zinc-500">Page views</div>
                  </div>
                )}
                {post.avg_position && (
                  <div className="rounded-lg bg-zinc-50 p-3">
                    <div className="text-lg font-bold text-zinc-900">
                      {Number(post.avg_position).toFixed(1)}
                    </div>
                    <div className="text-xs text-zinc-500">Avg position</div>
                  </div>
                )}
              </div>
            </div>

            {/* Slug */}
            <div className="rounded-lg border border-zinc-200 bg-white p-4">
              <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                Slug
              </h4>
              <input
                type="text"
                value={post.slug || ""}
                onChange={(e) => setPost({ ...post, slug: e.target.value })}
                placeholder="auto-generated-from-title"
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 font-mono placeholder:text-zinc-400 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            {/* SEO Preview */}
            <div className="rounded-lg border border-zinc-200 bg-white p-4">
              <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
                Google Search Preview
              </h4>
              <div className="rounded-lg bg-zinc-50 p-4 space-y-1">
                <div className="text-sm text-blue-700 truncate">
                  {post.title || "Post Title"} | Nassau
                </div>
                <div className="text-xs text-emerald-700">
                  nassau.golf/blog/{post.slug || "post-slug"}
                </div>
                <div className="text-xs text-zinc-600 line-clamp-2">
                  {post.meta_description || "Meta description will appear here..."}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
