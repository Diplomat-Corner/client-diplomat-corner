// lib/models/advertisement.model.ts
import mongoose, { Document, Schema } from "mongoose";

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

export function normalizeAdvertisementType(raw: string | undefined): AdvertisementPlacement {
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

export function toPlainAdvertisement<T extends Record<string, unknown>>(doc: T): T & {
  advertisementType: AdvertisementPlacement;
  imageUrls: string[];
} {
  const imageUrls = normalizeImageUrls({
    imageUrls: doc.imageUrls as string[] | undefined,
    imageUrl: doc.imageUrl as string | undefined,
  });
  return {
    ...doc,
    advertisementType: normalizeAdvertisementType(doc.advertisementType as string),
    imageUrls,
  };
}

interface ITracking {
  userId: string;
  timestamp: Date;
  device?: string;
  ipAddress?: string;
}

export interface IAdvertisement extends Document {
  _id: string;
  title: string;
  description: string;
  targetAudience?: string;
  advertisementType: AdvertisementPlacement;
  startTime?: string;
  endTime?: string;
  status: "Active" | "Inactive" | "Scheduled" | "Expired" | "Draft";
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
}

export interface AdvertisementResponse {
  _id: string;
  title: string;
  description: string;
  targetAudience?: string | null;
  advertisementType: AdvertisementPlacement;
  startTime?: string | null;
  endTime?: string | null;
  status: "Active" | "Inactive" | "Scheduled" | "Expired" | "Draft";
  priority: "High" | "Medium" | "Low";
  performanceMetrics?: string | null;
  hashtags: string[];
  timestamp: string;
  link: string;
  imageUrls: string[];
  clickCount: number;
  viewCount: number;
}

const TrackingSchema = new Schema(
  {
    userId: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    device: { type: String },
    ipAddress: { type: String },
  },
  { _id: false }
);

const AdvertisementSchema: Schema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  targetAudience: { type: String, required: false },
  advertisementType: { type: String, required: true },
  startTime: { type: String, required: false },
  endTime: { type: String, required: false },
  status: {
    type: String,
    required: true,
    enum: ["Active", "Inactive", "Scheduled", "Expired", "Draft"],
  },
  priority: { type: String, required: true, enum: ["High", "Medium", "Low"] },
  performanceMetrics: { type: String, required: false },
  hashtags: { type: [String], required: false },
  timestamp: { type: String, required: true },
  link: { type: String, required: true },
  imageUrl: { type: String, required: false },
  imageUrls: { type: [String], default: [] },
  clicks: { type: [TrackingSchema], default: [] },
  views: { type: [TrackingSchema], default: [] },
  clickCount: { type: Number, default: 0 },
  viewCount: { type: Number, default: 0 },
});

export default mongoose.models.Advertisement ||
  mongoose.model<IAdvertisement>("Advertisement", AdvertisementSchema);
