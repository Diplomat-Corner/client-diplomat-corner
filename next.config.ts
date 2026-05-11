import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/house", destination: "/house-for-rent", permanent: true },
      { source: "/car", destination: "/car-for-sale", permanent: true },
    ];
  },
  images: {
    // Remote images are already stored on media-api; server-side optimization (Sharp)
    // proxies every URL through Node and spiked CPU/RAM + upstream timeouts under load.
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "diplomatcorner.net" },
      { protocol: "https", hostname: "images.clerk.dev" },
      { protocol: "https", hostname: "img.clerk.com" },
      { protocol: "https", hostname: "uploadthing.com" },
      { protocol: "https", hostname: "media-api.diplomatcorner.net" },
      { protocol: "https", hostname: "utfs.io" },
      { protocol: "https", hostname: "files.stripe.com" },
      { protocol: "https", hostname: "www.gravatar.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "placehold.co" },
    ],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Quiets webpack cache serialization noise for large string literals (dev/build).
  webpack: (config) => {
    config.ignoreWarnings = [
      ...(config.ignoreWarnings ?? []),
      /Serializing big strings/,
    ];
    return config;
  },
};

export default nextConfig;
