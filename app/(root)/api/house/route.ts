// app/api/houses/route.ts
import { NextRequest, NextResponse } from "next/server";
import { Document } from "mongoose";
import House, { IHouse } from "@/lib/models/house.model";
import { connectToDatabase } from "@/lib/db-connect";

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

    await connectToDatabase();

    // Build the query
    const query: {
      status?: string | { $in: string[] };
      advertisementType?: string;
      userId?: string | { $ne: string };
    } = {};

    // Add filters
    if (advertisementType) {
      query.advertisementType = advertisementType;
    }
    if (userId) {
      query.userId = userId;
      // When fetching user's own listings, show all statuses (Active and Pending)
      query.status = { $in: ["Active", "Pending"] };
    } else if (excludeUserId) {
      query.userId = { $ne: excludeUserId };
      // When fetching other users' listings, only show Active
      query.status = "Active";
    } else {
      // Default: only show Active listings
      query.status = "Active";
    }

    // If userId is provided, skip pagination and return all user's listings
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

    // Calculate skip value for pagination for general listings
    const skip = (page - 1) * limit;

    // Get total count for pagination
    const total = await House.countDocuments(query);

    // Fetch houses with pagination and filters
    const houses = await House.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Calculate pagination info
    const hasMore = skip + houses.length < total;

    return NextResponse.json({
      success: true,
      houses: houses.map((house) => house.toObject()),
      pagination: {
        page,
        limit,
        total,
        hasMore,
      },
    });
  } catch (error) {
    console.error("Error in houses API:", error);
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
    console.log("POST /api/houses called with body:", body);
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
    return NextResponse.json(newHouse, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/houses:", error);
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
