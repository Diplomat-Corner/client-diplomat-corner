import type { ImageLoaderProps } from "next/image";

const SKIP_OPTIMIZATION_DOMAINS = [
  "media-api.diplomatcorner.net",
  "media-api.media-api.diplomatcorner.net",
];

export function customImageLoader({ src, width, quality }: ImageLoaderProps): string {
  // Check if the source is from a slow domain that should skip optimization
  const shouldSkipOptimization = SKIP_OPTIMIZATION_DOMAINS.some((domain) =>
    src.includes(domain)
  );

  if (shouldSkipOptimization) {
    // Return the original URL without going through Next.js optimization
    return src;
  }

  // Use Next.js default image optimization for other domains
  return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=${quality || 75}`;
}

export default customImageLoader;
