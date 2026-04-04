"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect } from "react";

const STORAGE_KEY = "diplomat_clerk_db_synced";

/**
 * After sign-in, ensures MongoDB has a user row once per tab session (or when Clerk userId changes).
 */
export function SyncClerkUser() {
  const { isLoaded, isSignedIn, userId } = useAuth();

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn || !userId) {
      sessionStorage.removeItem(STORAGE_KEY);
      return;
    }

    if (sessionStorage.getItem(STORAGE_KEY) === userId) {
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/users/sync", { method: "POST" });
        if (!cancelled && res.ok) {
          sessionStorage.setItem(STORAGE_KEY, userId);
        }
      } catch {
        // Retry on next navigation or refresh
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn, userId]);

  return null;
}
