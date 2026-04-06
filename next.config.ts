import type { NextConfig } from "next";

/**
 * Node can install a broken global `localStorage` when experimental Web Storage is
 * on but `--localstorage-file` is missing or invalid (common on Node 25+). Code
 * that touches `localStorage` during SSR (e.g. Clerk) then throws:
 * `localStorage.getItem is not a function`.
 *
 * This runs as soon as Next loads the config in the Node server process, before
 * request handling.
 */
function patchBrokenNodeLocalStorage(): void {
  if (typeof globalThis === "undefined") {
    return;
  }
  const g = globalThis as typeof globalThis & { localStorage?: Storage };
  const current = g.localStorage;
  if (current == null || typeof current.getItem === "function") {
    return;
  }

  const memory = new Map<string, string>();
  const memoryStorage: Storage = {
    get length() {
      return memory.size;
    },
    clear() {
      memory.clear();
    },
    getItem(key) {
      return memory.get(String(key)) ?? null;
    },
    setItem(key, value) {
      memory.set(String(key), String(value));
    },
    removeItem(key) {
      memory.delete(String(key));
    },
    key(index) {
      return Array.from(memory.keys())[index] ?? null;
    },
  };

  try {
    Object.defineProperty(g, "localStorage", {
      value: memoryStorage,
      configurable: true,
      enumerable: true,
      writable: true,
    });
  } catch {
    g.localStorage = memoryStorage;
  }
}

patchBrokenNodeLocalStorage();

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/house", destination: "/house-for-rent", permanent: true },
      { source: "/car", destination: "/car-for-sale", permanent: true },
    ];
  },
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
