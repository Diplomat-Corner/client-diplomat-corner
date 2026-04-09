import { connectToDatabase } from "@/lib/db-connect";
import Car, { ICar } from "@/lib/models/car.model";
import { NextRequest, NextResponse } from "next/server";
import Payment from "@/lib/models/payment.model";
import { auth } from "@clerk/nextjs/server";
import { v4 as uuidv4 } from "uuid";
import { uploadLogger, apiLogger } from "@/lib/logger";
import { cache, CACHE_TTL, CACHE_TAGS, createCacheKey } from "@/lib/cache";
import {
  attachSellerToRecord,
  buildClerkIdToSellerMap,
  type SellerPreview,
} from "@/lib/seller-preview";

/** Prefer server-only vars; fall back to NEXT_PUBLIC for existing deployments. */
const CPANEL_API_URL =
  process.env.CPANEL_API_URL ?? process.env.NEXT_PUBLIC_CPANEL_API_URL;
const CPANEL_USERNAME =
  process.env.CPANEL_USERNAME ?? process.env.NEXT_PUBLIC_CPANEL_USERNAME;
const CPANEL_API_TOKEN =
  process.env.CPANEL_API_TOKEN ?? process.env.NEXT_PUBLIC_CPANEL_API_TOKEN;
const PUBLIC_DOMAIN =
  process.env.PUBLIC_DOMAIN ?? process.env.NEXT_PUBLIC_PUBLIC_DOMAIN;

/** Aligns with React Query staleTime; safe for anonymous list/browse responses only. */
const PUBLIC_LIST_CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
};

const PRIVATE_USER_LIST_HEADERS = {
  "Cache-Control": "private, no-store",
};

interface ApiResponse {
  success: boolean;
  error?: string;
  message?: string;
  carId?: string;
  paymentId?: string;
  cars?: (ICar & { seller?: SellerPreview })[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  };
}

interface CarQuery {
  userId?: string | { $ne: string };
  advertisementType?: string;
  status?: "Active" | "Pending" | { $in: ("Active" | "Pending")[] };
}

async function uploadImage(
  file: File,
  folder: "public_images" | "receipts"
): Promise<{ success: boolean; publicUrl?: string; error?: string }> {
  const extension = file.name.split(".").pop();
  const randomFileName = `${uuidv4()}.${extension}`;

  const uploadFolder =
    folder === "receipts" ? "public_images/receipts" : folder;

  const apiFormData = new FormData();
  apiFormData.append("dir", `/public_html/${uploadFolder}/`);
  apiFormData.append("file-1", file, randomFileName);

  const authHeader = `cpanel ${CPANEL_USERNAME}:${
    CPANEL_API_TOKEN?.trim() || ""
  }`;

  try {
    uploadLogger.debug(`Starting image upload: ${randomFileName} (${file.size} bytes)`);

    const response = await fetch(
      `${CPANEL_API_URL}/execute/Fileman/upload_files`,
      {
        method: "POST",
        headers: { Authorization: authHeader },
        body: apiFormData,
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      uploadLogger.error(`cPanel API error: ${response.status} - ${errorText.substring(0, 200)}`);
      return {
        success: false,
        error: `Upload failed: ${response.status} ${response.statusText}`,
      };
    }

    let data;
    try {
      const responseText = await response.text();
      data = JSON.parse(responseText);
    } catch (jsonError) {
      uploadLogger.error("Failed to parse JSON response from cPanel");
      return {
        success: false,
        error:
          "Invalid response from upload service - received HTML instead of JSON",
      };
    }

    if (data.status === 0) {
      return {
        success: false,
        error: data.errors?.join(", ") || "Upload failed",
      };
    }

    const uploadedFile = data.data?.uploads[0];
    if (!uploadedFile || !uploadedFile.file) {
      return { success: false, error: "No uploaded file details returned" };
    }

    const publicUrl = `${PUBLIC_DOMAIN}/${uploadFolder}/${uploadedFile.file}`;
    uploadLogger.debug(`Upload successful: ${publicUrl}`);
    return { success: true, publicUrl };
  } catch (error) {
    uploadLogger.error("Image upload error:", error);
    return { success: false, error: "Failed to upload image" };
  }
}

export async function GET(
  req: NextRequest
): Promise<NextResponse<ApiResponse>> {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const userId = searchParams.get("userId");
    const excludeUserId = searchParams.get("excludeUserId");
    const advertisementType = searchParams.get("advertisementType");
    const includeSeller =
      searchParams.get("includeSeller") === "1" ||
      searchParams.get("includeSeller") === "true";

    const cacheKey = createCacheKey(
      CACHE_TAGS.CARS,
      "list",
      page,
      limit,
      userId,
      excludeUserId,
      advertisementType,
      includeSeller ? "incSeller" : "noSeller"
    );

    const cachedResponse = cache.get<ApiResponse>(cacheKey);
    if (cachedResponse && !userId) {
      return NextResponse.json(cachedResponse, {
        headers: PUBLIC_LIST_CACHE_HEADERS,
      });
    }

    await connectToDatabase();

    const query: CarQuery = {};

    if (userId) {
      query.userId = userId;
      query.status = { $in: ["Active", "Pending"] };
    } else if (excludeUserId) {
      query.userId = { $ne: excludeUserId };
      query.status = "Active";
    } else {
      query.status = "Active";
    }
    if (advertisementType) {
      query.advertisementType = advertisementType;
    }

    if (userId) {
      const cars = await Car.find(query).sort({ createdAt: -1 });
      const total = cars.length;

      return NextResponse.json(
        {
          success: true,
          cars,
          pagination: {
            total,
            page: 1,
            limit: total,
            hasMore: false,
          },
        },
        { headers: PRIVATE_USER_LIST_HEADERS }
      );
    }

    const skip = (page - 1) * limit;
    const total = await Car.countDocuments(query);
    const carsRaw = await Car.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean<ICar[]>();

    let cars: (ICar & { seller?: SellerPreview })[] = carsRaw as (ICar & {
      seller?: SellerPreview;
    })[];
    if (includeSeller && cars.length > 0) {
      const sellerMap = await buildClerkIdToSellerMap(
        cars.map((c) => c.userId).filter(Boolean)
      );
      cars = cars.map((c) => attachSellerToRecord(c, sellerMap));
    }

    const response: ApiResponse = {
      success: true,
      cars,
      pagination: {
        total,
        page,
        limit,
        hasMore: skip + cars.length < total,
      },
    };

    cache.set(cacheKey, response, {
      ttl: CACHE_TTL.MEDIUM,
      tags: [CACHE_TAGS.CARS],
    });

    return NextResponse.json(response, {
      headers: PUBLIC_LIST_CACHE_HEADERS,
    });
  } catch (error) {
    apiLogger.error("Error fetching cars:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch cars" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest
): Promise<NextResponse<ApiResponse>> {
  const createUrl = new URL("/api/cars/create", req.url);
  return NextResponse.redirect(createUrl) as NextResponse<ApiResponse>;
}
