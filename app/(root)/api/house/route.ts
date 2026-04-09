// GET/POST /api/house — app/(root)/api/house/route.ts
import { NextRequest, NextResponse } from "next/server";
import House, { IHouse } from "@/lib/models/house.model";
import { connectToDatabase } from "@/lib/db-connect";
import { apiLogger } from "@/lib/logger";
import { cache, CACHE_TTL, CACHE_TAGS, createCacheKey } from "@/lib/cache";
import {
  attachSellerToRecord,
  buildClerkIdToSellerMap,
  type SellerPreview,
} from "@/lib/seller-preview";

/** Aligns with server cache + React Query; anonymous list/browse only. */
const PUBLIC_LIST_CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
};

const PRIVATE_USER_LIST_HEADERS = {
  "Cache-Control": "private, no-store",
};

interface ApiResponse {
  success: boolean;
  error?: string;
  houses?: (IHouse & { seller?: SellerPreview })[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  };
}

export async function GET(
  req: NextRequest
): Promise<NextResponse<ApiResponse>> {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const advertisementType = searchParams.get("advertisementType");
    const userId = searchParams.get("userId");
    const excludeUserId = searchParams.get("excludeUserId");
    const includeSeller =
      searchParams.get("includeSeller") === "1" ||
      searchParams.get("includeSeller") === "true";

    const cacheKey = createCacheKey(
      CACHE_TAGS.HOUSES,
      "list",
      page,
      limit,
      advertisementType,
      userId,
      excludeUserId,
      includeSeller ? "incSeller" : "noSeller"
    );

    const cachedResponse = cache.get<ApiResponse>(cacheKey);
    if (cachedResponse && !userId) {
      return NextResponse.json(cachedResponse, {
        headers: PUBLIC_LIST_CACHE_HEADERS,
      });
    }

    await connectToDatabase();

    const query: {
      status?: string | { $in: string[] };
      advertisementType?: string;
      userId?: string | { $ne: string };
    } = {};

    if (advertisementType) {
      query.advertisementType = advertisementType;
    }
    if (userId) {
      query.userId = userId;
      query.status = { $in: ["Active", "Pending"] };
    } else if (excludeUserId) {
      query.userId = { $ne: excludeUserId };
      query.status = "Active";
    } else {
      query.status = "Active";
    }

    if (userId) {
      const houses = await House.find(query).sort({ createdAt: -1 });
      const total = houses.length;

      return NextResponse.json(
        {
          success: true,
          houses: houses.map((house) => house.toObject()),
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
    const total = await House.countDocuments(query);
    const housesRaw = await House.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean<IHouse[]>();

    let housesPlain: (IHouse & { seller?: SellerPreview })[] = housesRaw as (IHouse & {
      seller?: SellerPreview;
    })[];
    if (includeSeller && housesPlain.length > 0) {
      const sellerMap = await buildClerkIdToSellerMap(
        housesPlain.map((h) => h.userId).filter(Boolean)
      );
      housesPlain = housesPlain.map((h) => attachSellerToRecord(h, sellerMap));
    }

    const hasMore = skip + housesPlain.length < total;

    const response: ApiResponse = {
      success: true,
      houses: housesPlain,
      pagination: {
        page,
        limit,
        total,
        hasMore,
      },
    };

    cache.set(cacheKey, response, {
      ttl: CACHE_TTL.MEDIUM,
      tags: [CACHE_TAGS.HOUSES],
    });

    return NextResponse.json(response, {
      headers: PUBLIC_LIST_CACHE_HEADERS,
    });
  } catch (error) {
    apiLogger.error("Error in houses API:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();
    apiLogger.debug("POST /api/houses called");
    const {
      name,
      userId,
      description,
      advertisementType,
      price,
      paymentMethod,
      bedroom,
      parkingSpace,
      bathroom,
      size,
      houseType,
      condition,
      maintenance,
      essentials,
      currency,
    } = body;

    if (
      !name ||
      !userId ||
      !description ||
      !advertisementType ||
      !price ||
      !paymentMethod ||
      !bedroom ||
      !parkingSpace ||
      !bathroom ||
      !size ||
      !houseType
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const newHouse = new House({
      name,
      userId,
      description,
      advertisementType,
      price,
      paymentMethod,
      bedroom,
      parkingSpace,
      bathroom,
      size,
      houseType,
      condition,
      maintenance,
      essentials,
      currency,
    });

    await newHouse.save();

    cache.invalidateByTag(CACHE_TAGS.HOUSES);

    return NextResponse.json(newHouse, { status: 201 });
  } catch (error) {
    apiLogger.error("Error in POST /api/houses:", error);
    return NextResponse.json(
      {
        error: `Failed to create house: ${
          (error as Error).message || "Unknown server error"
        }`,
      },
      { status: 500 }
    );
  }
}
