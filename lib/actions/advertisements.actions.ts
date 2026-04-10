"use server";

import { connectToDatabase } from "@/lib/db-connect";
import Advertisement, {
  IAdvertisement,
  AdvertisementResponse,
  AdvertisementPlacement,
  toPlainAdvertisement,
} from "@/lib/models/advertisement.model";

const PRIORITY_RANK: Record<string, number> = { High: 0, Medium: 1, Low: 2 };

function isAdActiveInWindow(ad: {
  status: string;
  startTime?: string | null;
  endTime?: string | null;
}): boolean {
  if (ad.status !== "Active") return false;
  const now = Date.now();
  if (ad.startTime) {
    const t = new Date(ad.startTime).getTime();
    if (!Number.isNaN(t) && now < t) return false;
  }
  if (ad.endTime) {
    const t = new Date(ad.endTime).getTime();
    if (!Number.isNaN(t) && now > t) return false;
  }
  return true;
}

function comparePriorityThenTime(
  a: { priority: string; timestamp: string },
  b: { priority: string; timestamp: string }
): number {
  const pa = PRIORITY_RANK[a.priority] ?? 99;
  const pb = PRIORITY_RANK[b.priority] ?? 99;
  if (pa !== pb) return pa - pb;
  return (b.timestamp || "").localeCompare(a.timestamp || "");
}

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
  await connectToDatabase();

  const docs = await Advertisement.find({ status: "Active" })
    .select(
      "_id title description link imageUrls imageUrl advertisementType priority timestamp startTime endTime status"
    )
    .lean();

  const mapped: HomePublicAd[] = [];
  for (const doc of docs) {
    const row = doc as {
      status: string;
      startTime?: string | null;
      endTime?: string | null;
    };
    if (!isAdActiveInWindow(row)) continue;
    const base = { ...doc, _id: String(doc._id) };
    const n = toPlainAdvertisement(base as Record<string, unknown>);
    mapped.push({
      _id: n._id as string,
      title: String(n.title),
      description: String(n.description),
      link: String(n.link),
      imageUrls: n.imageUrls,
      advertisementType: n.advertisementType,
      priority: n.priority as HomePublicAd["priority"],
      timestamp: String(n.timestamp),
    });
  }

  const carousels = mapped
    .filter((x) => x.advertisementType === "carousel")
    .sort(comparePriorityThenTime);
  const bannerList = mapped
    .filter((x) => x.advertisementType === "banner")
    .sort(comparePriorityThenTime);
  const normals = mapped
    .filter((x) => x.advertisementType === "normal")
    .sort(comparePriorityThenTime)
    .slice(0, 2);

  return {
    carousel: carousels[0] ?? null,
    banners: bannerList.slice(0, 2),
    normals,
  };
}

export async function getAllAD(): Promise<AdvertisementResponse[]> {
  await connectToDatabase();

  const ads = await Advertisement.find({}).lean();
  if (!ads.length) {
    return [];
  }
  return ads.map((ad) => {
    const plain = toPlainAdvertisement({
      ...(ad as object),
      _id: String(ad._id),
    } as Record<string, unknown>);
    return {
      _id: plain._id as string,
      title: String(plain.title),
      description: String(plain.description),
      targetAudience: (plain.targetAudience as string) ?? null,
      advertisementType: plain.advertisementType,
      startTime: (plain.startTime as string) ?? null,
      endTime: (plain.endTime as string) ?? null,
      status: plain.status as AdvertisementResponse["status"],
      priority: plain.priority as AdvertisementResponse["priority"],
      performanceMetrics: (plain.performanceMetrics as string) ?? null,
      hashtags: (plain.hashtags as string[]) ?? [],
      timestamp: String(plain.timestamp),
      link: String(plain.link),
      imageUrls: plain.imageUrls,
      clickCount: Number(plain.clickCount ?? 0),
      viewCount: Number(plain.viewCount ?? 0),
    };
  });
}

export async function createAdvertisement(adDetails: Partial<IAdvertisement>) {
  await connectToDatabase();

  const imageUrls =
    adDetails.imageUrls?.filter(Boolean) ??
    (adDetails.imageUrl ? [adDetails.imageUrl] : []);

  const advertisement = new Advertisement({
    ...adDetails,
    imageUrls,
    timestamp: new Date().toISOString(),
    clickCount: adDetails.clickCount ?? 0,
    viewCount: adDetails.viewCount ?? 0,
  });

  await advertisement.save();
  return { success: true, id: advertisement._id.toString() };
}

export async function updateAdvertisement(adId: string, updatedDetails: Partial<IAdvertisement>) {
  await connectToDatabase();

  const advertisement = await Advertisement.findById(adId);
  if (!advertisement) {
    throw new Error("Advertisement not found");
  }

  if (advertisement.status === "Inactive") {
    throw new Error("Cannot edit an inactive advertisement");
  }

  await Advertisement.findByIdAndUpdate(adId, updatedDetails);
  return { success: true };
}

export async function deleteAdvertisement(adId: string) {
  await connectToDatabase();

  await Advertisement.findByIdAndDelete(adId);
  return { success: true };
}

export async function getAdvertisementDetails(adId: string) {
  await connectToDatabase();

  const advertisement = await Advertisement.findById(adId);
  if (!advertisement) {
    throw new Error("Advertisement not found");
  }

  return {
    ...advertisement.toObject(),
    _id: advertisement._id.toString(),
  };
}

export async function listAllAdvertisements() {
  await connectToDatabase();

  const advertisements = await Advertisement.find();
  return advertisements.map((ad) => ({
    ...ad.toObject(),
    _id: ad._id.toString(),
  }));
}

export async function scheduleAdvertisement(
  adDetails: Partial<IAdvertisement>,
  startTime: string,
  endTime: string
) {
  await connectToDatabase();

  const imageUrls =
    adDetails.imageUrls?.filter(Boolean) ??
    (adDetails.imageUrl ? [adDetails.imageUrl] : []);

  const advertisement = new Advertisement({
    ...adDetails,
    imageUrls,
    startTime,
    endTime,
    status: "Scheduled",
    timestamp: new Date().toISOString(),
    clickCount: 0,
    viewCount: 0,
  });

  await advertisement.save();
  return { success: true, id: advertisement._id.toString() };
}

export async function setAdvertisementPriority(adId: string, priority: "High" | "Medium" | "Low") {
  await connectToDatabase();

  await Advertisement.findByIdAndUpdate(adId, { priority });
  return { success: true };
}

export async function activateAdvertisement(adId: string) {
  await connectToDatabase();

  await Advertisement.findByIdAndUpdate(adId, { status: "Active" });
  return { success: true };
}

export async function deactivateAdvertisement(adId: string) {
  await connectToDatabase();

  await Advertisement.findByIdAndUpdate(adId, { status: "Inactive" });
  return { success: true };
}

export async function getAdvertisementPerformance(adId: string) {
  await connectToDatabase();

  const advertisement = await Advertisement.findById(adId);
  if (!advertisement) {
    throw new Error("Advertisement not found");
  }

  return advertisement.performanceMetrics || "No metrics available";
}