interface CacheEntry<T> {
  data: T;
  expiry: number;
  tags: string[];
}

interface CacheOptions {
  ttl?: number;
  tags?: string[];
}

class InMemoryCache {
  private cache: Map<string, CacheEntry<unknown>> = new Map();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes default

  set<T>(key: string, data: T, options: CacheOptions = {}): void {
    const { ttl = this.defaultTTL, tags = [] } = options;
    const expiry = Date.now() + ttl;
    this.cache.set(key, { data, expiry, tags });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  invalidateByTag(tag: string): void {
    const keysToDelete: string[] = [];
    
    this.cache.forEach((entry, key) => {
      if (entry.tags.includes(tag)) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  invalidateByPrefix(prefix: string): void {
    const keysToDelete: string[] = [];
    
    this.cache.forEach((_, key) => {
      if (key.startsWith(prefix)) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  clear(): void {
    this.cache.clear();
  }

  cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];
    
    this.cache.forEach((entry, key) => {
      if (now > entry.expiry) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  size(): number {
    return this.cache.size;
  }

  getStats(): { size: number; expired: number } {
    const now = Date.now();
    let expired = 0;
    
    this.cache.forEach((entry) => {
      if (now > entry.expiry) {
        expired++;
      }
    });

    return { size: this.cache.size, expired };
  }
}

const globalCache = (global as unknown as { __cache?: InMemoryCache }).__cache || new InMemoryCache();
(global as unknown as { __cache: InMemoryCache }).__cache = globalCache;

export const cache = globalCache;

export const CACHE_TTL = {
  SHORT: 30 * 1000,         // 30 seconds
  MEDIUM: 5 * 60 * 1000,    // 5 minutes
  LONG: 30 * 60 * 1000,     // 30 minutes
  HOUR: 60 * 60 * 1000,     // 1 hour
  DAY: 24 * 60 * 60 * 1000, // 24 hours
};

export const CACHE_TAGS = {
  CARS: "cars",
  HOUSES: "houses",
  USERS: "users",
  NOTIFICATIONS: "notifications",
  REVIEWS: "reviews",
  FEATURED: "featured",
  ADVERTISEMENTS: "advertisements",
};

export function createCacheKey(...parts: (string | number | undefined | null)[]): string {
  return parts.filter(Boolean).join(":");
}

export async function getCachedOrFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: CacheOptions = {}
): Promise<T> {
  const cached = cache.get<T>(key);
  if (cached !== null) {
    return cached;
  }

  const data = await fetcher();
  cache.set(key, data, options);
  return data;
}

if (typeof setInterval !== "undefined") {
  setInterval(() => {
    globalCache.cleanup();
  }, 60 * 1000);
}
