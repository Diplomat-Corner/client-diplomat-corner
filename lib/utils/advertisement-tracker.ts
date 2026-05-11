"use client";

import { useEffect } from "react";
import type { MouseEvent } from "react";

export async function trackView(adId: string): Promise<number | null> {
  try {
    const response = await fetch(`/api/advertisements/${adId}/view`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      console.error("Failed to track view:", await response.text());
      return null;
    }

    const data = await response.json();
    return data.viewCount ?? null;
  } catch (error) {
    console.error("Error tracking advertisement view:", error);
    return null;
  }
}

export async function trackClick(adId: string): Promise<number | null> {
  try {
    const response = await fetch(`/api/advertisements/${adId}/click`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      console.error("Failed to track click:", await response.text());
      return null;
    }

    const data = await response.json();
    return data.clickCount ?? null;
  } catch (error) {
    console.error("Error tracking advertisement click:", error);
    return null;
  }
}

export function useAdvertisementView(adId: string | undefined): void {
  useEffect(() => {
    if (!adId || typeof window === "undefined") return;

    const key = `ad_view_${adId}`;
    const hasViewed = sessionStorage.getItem(key);
    if (hasViewed) return;

    void trackView(adId).then(() => {
      sessionStorage.setItem(key, "true");
    });
  }, [adId]);
}

export function createClickHandler(
  adId: string,
  url: string
): (e: MouseEvent) => void {
  return (e: MouseEvent) => {
    e.preventDefault();

    void trackClick(adId).then(() => {
      window.location.href = url;
    });
  };
}
