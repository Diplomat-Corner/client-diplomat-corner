/** Shared advertisement types and helpers — safe to import from Client Components (no mongoose). */

export const ADVERTISEMENT_TYPES = ["carousel", "normal", "banner"] as const;
export type AdvertisementPlacement = (typeof ADVERTISEMENT_TYPES)[number];

const LEGACY_TO_PLACEMENT: Record<string, AdvertisementPlacement> = {
  carousel: "carousel",
  normal: "normal",
  banner: "banner",
  popup: "normal",
  sidebar: "normal",
  incontent: "normal",
  in_content: "normal",
  "in-content": "normal",
};

export function normalizeAdvertisementType(
  raw: string | undefined
): AdvertisementPlacement {
  if (!raw) return "normal";
  const key = raw.toLowerCase().replace(/-/g, "_");
  if (ADVERTISEMENT_TYPES.includes(raw as AdvertisementPlacement)) {
    return raw as AdvertisementPlacement;
  }
  if (ADVERTISEMENT_TYPES.includes(key as AdvertisementPlacement)) {
    return key as AdvertisementPlacement;
  }
  return LEGACY_TO_PLACEMENT[key] ?? "normal";
}

export function normalizeImageUrls(doc: {
  imageUrls?: string[] | null;
  imageUrl?: string | null;
}): string[] {
  const urls = doc.imageUrls?.filter(Boolean) ?? [];
  if (urls.length > 0) return urls;
  if (doc.imageUrl) return [doc.imageUrl];
  return [];
}

export function toPlainAdvertisement<T extends Record<string, unknown>>(
  doc: T
): T & {
  advertisementType: AdvertisementPlacement;
  imageUrls: string[];
} {
  const imageUrls = normalizeImageUrls({
    imageUrls: doc.imageUrls as string[] | undefined,
    imageUrl: doc.imageUrl as string | undefined,
  });
  return {
    ...doc,
    advertisementType: normalizeAdvertisementType(
      doc.advertisementType as string
    ),
    imageUrls,
  };
}

export interface ITracking {
  userId: string;
  timestamp: Date;
  device?: string;
  ipAddress?: string;
}

export const ADVERTISEMENT_PUBLICATION_STATUSES = [
  "Active",
  "Inactive",
  "Draft",
] as const;
export type AdvertisementPublicationStatus =
  (typeof ADVERTISEMENT_PUBLICATION_STATUSES)[number];

export const ADVERTISEMENT_EFFECTIVE_STATUSES = [
  "Active",
  "Inactive",
  "Scheduled",
  "Expired",
  "Draft",
] as const;
export type AdvertisementEffectiveStatus =
  (typeof ADVERTISEMENT_EFFECTIVE_STATUSES)[number];

export function normalizePublicationStatus(
  raw: string | undefined | null
): AdvertisementPublicationStatus {
  if (!raw) return "Draft";
  if (
    (ADVERTISEMENT_PUBLICATION_STATUSES as readonly string[]).includes(raw)
  ) {
    return raw as AdvertisementPublicationStatus;
  }
  if (raw === "Scheduled") return "Active";
  if (raw === "Expired") return "Inactive";
  return "Draft";
}

export function computeAdvertisementEffectiveStatus(
  input: {
    status: string;
    startTime?: string | null;
    endTime?: string | null;
  },
  now: Date = new Date()
): AdvertisementEffectiveStatus {
  const publication = normalizePublicationStatus(input.status);
  if (publication === "Draft" || publication === "Inactive") {
    return publication;
  }
  const t = now.getTime();
  if (input.startTime) {
    const start = new Date(input.startTime).getTime();
    if (!Number.isNaN(start) && t < start) return "Scheduled";
  }
  if (input.endTime) {
    const end = new Date(input.endTime).getTime();
    if (!Number.isNaN(end) && t > end) return "Expired";
  }
  return "Active";
}

export function enrichAdvertisementWithEffectiveStatus<
  T extends Record<string, unknown>,
>(doc: T): T & { effectiveStatus: AdvertisementEffectiveStatus } {
  return {
    ...doc,
    effectiveStatus: computeAdvertisementEffectiveStatus({
      status: String(doc.status ?? ""),
      startTime: doc.startTime as string | null | undefined,
      endTime: doc.endTime as string | null | undefined,
    }),
  };
}

export interface IAdvertisement {
  _id: string;
  title: string;
  description: string;
  targetAudience?: string;
  advertisementType: AdvertisementPlacement;
  startTime?: string;
  endTime?: string;
  status: AdvertisementPublicationStatus;
  priority: "High" | "Medium" | "Low";
  performanceMetrics?: string;
  hashtags?: string[];
  timestamp: string;
  link: string;
  imageUrl?: string;
  imageUrls: string[];
  clicks: ITracking[];
  views: ITracking[];
  clickCount: number;
  viewCount: number;
  effectiveStatus?: AdvertisementEffectiveStatus;
}

export interface AdvertisementResponse {
  _id: string;
  title: string;
  description: string;
  targetAudience?: string | null;
  advertisementType: AdvertisementPlacement;
  startTime?: string | null;
  endTime?: string | null;
  status: AdvertisementPublicationStatus;
  effectiveStatus: AdvertisementEffectiveStatus;
  priority: "High" | "Medium" | "Low";
  performanceMetrics?: string | null;
  hashtags: string[];
  timestamp: string;
  link: string;
  imageUrls: string[];
  clickCount: number;
  viewCount: number;
}
