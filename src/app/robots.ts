import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/dashboard",
          "/profile",
          "/trips/",
          "/rounds/",
          "/settlements",
          "/admin",
          "/demo",
        ],
      },
    ],
    sitemap: "https://nassau.golf/sitemap.xml",
  };
}
