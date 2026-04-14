import { MetadataRoute } from "next";
import { createServiceClient } from "@/lib/supabase/admin";
import { LAUNCH_DESTINATION_SLUGS } from "@/lib/destination-utils";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://nassau.golf";
  const now = new Date();

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/pricing`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${baseUrl}/founding`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${baseUrl}/explore`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${baseUrl}/login`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
  ];

  // Destination preview pages (15 launch destinations)
  const destinationPages: MetadataRoute.Sitemap = LAUNCH_DESTINATION_SLUGS.map((slug) => ({
    url: `${baseUrl}/trip/preview/${slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  // Blog posts from database
  let blogPages: MetadataRoute.Sitemap = [];
  try {
    const supabase = createServiceClient();
    const { data: posts } = await supabase
      .from("seo_blog_posts")
      .select("slug, updated_at")
      .eq("status", "published");

    blogPages = (posts || []).map((post: any) => ({
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: post.updated_at ? new Date(post.updated_at) : now,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    }));
  } catch {
    // Blog posts will be empty if DB is unavailable
  }

  return [...staticPages, ...destinationPages, ...blogPages];
}
