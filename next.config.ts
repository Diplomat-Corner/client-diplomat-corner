import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "diplomatcorner.net" },
      { protocol: "https", hostname: "images.clerk.dev" },
      { protocol: "https", hostname: "img.clerk.com" },
      { protocol: "https", hostname: "uploadthing.com" },
      { protocol: "https", hostname: "media-api.media-api.diplomatcorner.net" },
      { protocol: "https", hostname: "media-api.diplomatcorner.net" },
      { protocol: "https", hostname: "utfs.io" },
      { protocol: "https", hostname: "files.stripe.com" },
      { protocol: "https", hostname: "www.gravatar.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
    ],
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24, // 24 hours
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
