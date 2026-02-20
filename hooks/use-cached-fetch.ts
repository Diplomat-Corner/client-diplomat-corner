"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

interface UseCachedFetchOptions {
  ttl?: number;
  enabled?: boolean;
  refetchOnFocus?: boolean;
  refetchInterval?: number;
}

interface UseCachedFetchResult<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  mutate: (newData: T | ((prev: T | null) => T)) => void;
}

const clientCache = new Map<string, CacheEntry<unknown>>();

const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

export function useCachedFetch<T>(
  key: string | null,
  fetcher: () => Promise<T>,
  options: UseCachedFetchOptions = {}
): UseCachedFetchResult<T> {
  const {
    ttl = DEFAULT_TTL,
    enabled = true,
    refetchOnFocus = false,
    refetchInterval,
  } = options;

  const [data, setData] = useState<T | null>(() => {
    if (!key) return null;
    const cached = clientCache.get(key) as CacheEntry<T> | undefined;
    if (cached && Date.now() - cached.timestamp < ttl) {
      return cached.data;
    }
    return null;
  });

  const [isLoading, setIsLoading] = useState(!data && enabled);
  const [error, setError] = useState<Error | null>(null);
  const mountedRef = useRef(true);
  const fetchingRef = useRef(false);

  const fetchData = useCallback(async () => {
    if (!key || !enabled || fetchingRef.current) return;

    const cached = clientCache.get(key) as CacheEntry<T> | undefined;
    if (cached && Date.now() - cached.timestamp < ttl) {
      setData(cached.data);
      setIsLoading(false);
      return;
    }

    fetchingRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      const result = await fetcher();
      
      if (mountedRef.current) {
        clientCache.set(key, { data: result, timestamp: Date.now() });
        setData(result);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err : new Error("Fetch failed"));
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
      fetchingRef.current = false;
    }
  }, [key, enabled, ttl, fetcher]);

  const refetch = useCallback(async () => {
    if (key) {
      clientCache.delete(key);
    }
    await fetchData();
  }, [key, fetchData]);

  const mutate = useCallback(
    (newData: T | ((prev: T | null) => T)) => {
      const updatedData =
        typeof newData === "function"
          ? (newData as (prev: T | null) => T)(data)
          : newData;

      setData(updatedData);
      if (key) {
        clientCache.set(key, { data: updatedData, timestamp: Date.now() });
      }
    },
    [key, data]
  );

  useEffect(() => {
    mountedRef.current = true;
    fetchData();

    return () => {
      mountedRef.current = false;
    };
  }, [fetchData]);

  useEffect(() => {
    if (!refetchOnFocus) return;

    const handleFocus = () => {
      fetchData();
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [refetchOnFocus, fetchData]);

  useEffect(() => {
    if (!refetchInterval || !enabled) return;

    const interval = setInterval(() => {
      fetchData();
    }, refetchInterval);

    return () => clearInterval(interval);
  }, [refetchInterval, enabled, fetchData]);

  return { data, isLoading, error, refetch, mutate };
}

export function invalidateCache(keyOrPrefix: string): void {
  if (keyOrPrefix.endsWith("*")) {
    const prefix = keyOrPrefix.slice(0, -1);
    const keysToDelete: string[] = [];
    clientCache.forEach((_, key) => {
      if (key.startsWith(prefix)) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach((key) => clientCache.delete(key));
  } else {
    clientCache.delete(keyOrPrefix);
  }
}

export function clearCache(): void {
  clientCache.clear();
}

export function getCacheStats(): { size: number; keys: string[] } {
  return {
    size: clientCache.size,
    keys: Array.from(clientCache.keys()),
  };
}
