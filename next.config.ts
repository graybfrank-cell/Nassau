import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pg"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  // Only export static when building for native app (Capacitor iOS)
  ...(process.env.IS_NATIVE === "1" && {
    output: "export",
    images: {
      unoptimized: true,
    },
  }),
};

export default nextConfig;
