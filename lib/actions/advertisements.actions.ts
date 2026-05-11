"use server";

import { diplomatServerFetch } from "@/lib/diplomat-server";
import type {
  IAdvertisement,
  AdvertisementResponse,
  AdvertisementPlacement,
} from "@/lib/models/advertisement.types";

export type HomePublicAd = {
  _id: string;
  title: string;
  description: string;
  link: string;
  imageUrls: string[];
  advertisementType: AdvertisementPlacement;
  priority: "High" | "Medium" | "Low";
  timestamp: string;
};

export async function getHomeAdvertisements(): Promise<{
  carousel: HomePublicAd | null;
  banners: HomePublicAd[];
  normals: HomePublicAd[];
}> {
  const res = await diplomatServerFetch("/api/advertisements/home");
  if (!res.ok) {
    return { carousel: null, banners: [], normals: [] };
  }
  return (await res.json()) as {
    carousel: HomePublicAd | null;
    banners: HomePublicAd[];
    normals: HomePublicAd[];
  };
}

export async function getAllAD(): Promise<AdvertisementResponse[]> {
  const res = await diplomatServerFetch("/api/advertisements");
  if (!res.ok) {
    throw new Error("Failed to fetch advertisements");
  }
  const data = await res.json();
  if (Array.isArray(data)) {
    return data as AdvertisementResponse[];
  }
  if (data?.advertisements) {
    return data.advertisements as AdvertisementResponse[];
  }
  return [];
}

export async function createAdvertisement(adDetails: Partial<IAdvertisement>) {
  const res = await diplomatServerFetch("/api/advertisements", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(adDetails),
  });
  if (!res.ok) {
    throw new Error("Failed to create advertisement");
  }
  return (await res.json()) as { success: boolean; id?: string };
}

export async function updateAdvertisement(
  adId: string,
  updatedDetails: Partial<IAdvertisement>
) {
  const res = await diplomatServerFetch(`/api/advertisements/${adId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updatedDetails),
  });
  if (!res.ok) {
    throw new Error("Failed to update advertisement");
  }
  return { success: true };
}

export async function deleteAdvertisement(adId: string) {
  const res = await diplomatServerFetch(`/api/advertisements/${adId}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    throw new Error("Failed to delete advertisement");
  }
  return { success: true };
}

export async function getAdvertisementDetails(adId: string) {
  const res = await diplomatServerFetch(`/api/advertisements/${adId}`);
  if (!res.ok) {
    throw new Error("Advertisement not found");
  }
  const data = (await res.json()) as { advertisement?: unknown } & Record<string, unknown>;
  return data.advertisement ?? data;
}

export async function listAllAdvertisements() {
  return getAllAD();
}

export async function scheduleAdvertisement(
  adDetails: Partial<IAdvertisement>,
  startTime: string,
  endTime: string
) {
  const res = await diplomatServerFetch("/api/advertisements", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...adDetails,
      startTime,
      endTime,
      status: "Active",
      clickCount: 0,
      viewCount: 0,
    }),
  });
  if (!res.ok) {
    throw new Error("Failed to schedule advertisement");
  }
  return (await res.json()) as { success: boolean; id?: string };
}

export async function setAdvertisementPriority(
  adId: string,
  priority: "High" | "Medium" | "Low"
) {
  const res = await diplomatServerFetch(`/api/advertisements/${adId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ priority }),
  });
  if (!res.ok) {
    throw new Error("Failed to set priority");
  }
  return { success: true };
}

export async function activateAdvertisement(adId: string) {
  const res = await diplomatServerFetch(`/api/advertisements/${adId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "Active" }),
  });
  if (!res.ok) {
    throw new Error("Failed to activate");
  }
  return { success: true };
}

export async function deactivateAdvertisement(adId: string) {
  const res = await diplomatServerFetch(`/api/advertisements/${adId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "Inactive" }),
  });
  if (!res.ok) {
    throw new Error("Failed to deactivate");
  }
  return { success: true };
}

export async function getAdvertisementPerformance(adId: string) {
  const res = await diplomatServerFetch(
    `/api/advertisements/${adId}?analytics=true`
  );
  if (!res.ok) {
    throw new Error("Advertisement not found");
  }
  const data = await res.json();
  return (data?.metrics as string) || "No metrics available";
}
