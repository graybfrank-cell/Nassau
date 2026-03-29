"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";

interface Props {
  markdown: string;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-");
}

function sanitizeContent(content: string): string {
  return content
    .replace(/<cite[^>]*>/g, "")
    .replace(/<\/cite>/g, "");
}

function resolveInternalLink(href: string): string {
  if (href.startsWith("/explore")) return "/explore";
  if (href.startsWith("/trips/new")) return "/trips/new";
  return href;
}

const components: Components = {
  h2: ({ children }) => {
    const text = typeof children === "string" ? children : String(children);
    const id = slugify(text);
    return (
      <h2
        id={id}
        className="text-[1.75rem] font-bold mt-10 mb-4 text-zinc-900 scroll-mt-6"
      >
        {children}
      </h2>
    );
  },
  h3: ({ children }) => (
    <h3 className="text-[1.35rem] font-semibold mt-8 mb-3 text-zinc-800">
      {children}
    </h3>
  ),
  p: ({ children, node }) => {
    // Check if the paragraph contains only an image
    const hasImage = node?.children?.some(
      (child) => child.type === "element" && child.tagName === "img"
    );
    if (hasImage) {
      return <>{children}</>;
    }
    return (
      <p className="text-lg leading-[1.8] text-zinc-700 mb-6">{children}</p>
    );
  },
  a: ({ href, children }) => {
    const resolved = href ? resolveInternalLink(href) : href;
    return (
      <a
        href={resolved}
        className="text-coral underline hover:text-coral/90"
        target={resolved?.startsWith("http") ? "_blank" : undefined}
        rel={resolved?.startsWith("http") ? "noopener noreferrer" : undefined}
      >
        {children}
      </a>
    );
  },
  img: ({ src, alt }) => (
    <figure className="my-8">
      <img
        src={src}
        alt={alt || ""}
        className="rounded-xl w-full"
        loading="lazy"
      />
      {alt && !alt.startsWith("Photo:") && (
        <figcaption className="mt-2 text-center text-sm text-zinc-400">
          {alt}
        </figcaption>
      )}
    </figure>
  ),
  ul: ({ children }) => (
    <ul className="text-lg leading-[1.8] text-zinc-700 mb-6 pl-6 list-disc space-y-1">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="text-lg leading-[1.8] text-zinc-700 mb-6 pl-6 list-decimal space-y-1">
      {children}
    </ol>
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-teal pl-6 italic text-zinc-500 my-8">
      {children}
    </blockquote>
  ),
  strong: ({ children }) => (
    <strong className="text-zinc-900 font-semibold">{children}</strong>
  ),
  em: ({ children }) => <em className="text-zinc-600">{children}</em>,
  hr: () => <hr className="my-10 border-zinc-200" />,
  code: ({ children, className }) => {
    // Inline code vs code block
    if (className) {
      return (
        <code className="block overflow-x-auto rounded-lg bg-zinc-900 p-4 text-sm text-zinc-100 my-6">
          {children}
        </code>
      );
    }
    return (
      <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-sm text-zinc-800 font-mono">
        {children}
      </code>
    );
  },
};

export default function BlogArticleContent({ markdown }: Props) {
  const cleanContent = sanitizeContent(markdown);

  return (
    <article className="article-body">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {cleanContent}
      </ReactMarkdown>
    </article>
  );
}
