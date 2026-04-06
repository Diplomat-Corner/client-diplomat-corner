// GET/POST /api/house — app/(root)/api/house/route.ts
import { NextRequest, NextResponse } from "next/server";
import House, { IHouse } from "@/lib/models/house.model";
import { connectToDatabase } from "@/lib/db-connect";
import { apiLogger } from "@/lib/logger";
import { cache, CACHE_TTL, CACHE_TAGS, createCacheKey } from "@/lib/cache";

interface ApiResponse {
  success: boolean;
  error?: string;
  houses?: IHouse[];
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

    const cacheKey = createCacheKey(
      CACHE_TAGS.HOUSES,
      "list",
      page,
      limit,
      advertisementType,
      userId,
      excludeUserId
    );

    const cachedResponse = cache.get<ApiResponse>(cacheKey);
    if (cachedResponse && !userId) {
      return NextResponse.json(cachedResponse);
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

      return NextResponse.json({
        success: true,
        houses: houses.map((house) => house.toObject()),
        pagination: {
          total,
          page: 1,
          limit: total,
          hasMore: false,
        },
      });
    }

    const skip = (page - 1) * limit;
    const total = await House.countDocuments(query);
    const houses = await House.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const hasMore = skip + houses.length < total;

    const response: ApiResponse = {
      success: true,
      houses: houses.map((house) => house.toObject()),
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

    return NextResponse.json(response);
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
