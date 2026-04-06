import { NextRequest, NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db-connect";
import Review from "@/lib/models/review.model";
import Car from "@/lib/models/car.model";
import House from "@/lib/models/house.model";
import { withApiRoute, getClientIp } from "@/lib/api-observability";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { FEATURED_PRODUCTS_CACHE_TAG } from "@/lib/featured-cache-tag";

interface FeaturedProduct {
  _id: string;
  productId: string;
  type: "car" | "house";
  name: string;
  price: number;
  advertisementType: string;
  imageUrl: string;
  averageRating: number;
  totalReviews: number;
  totalLikes: number;
}

const CACHE_EXPIRY = 86400;
/** 5 minutes — balances freshness vs CPU (see observability plan). */
const REVALIDATE_SEC = 300;

async function computeFeaturedProducts(): Promise<FeaturedProduct[]> {
  await connectToDatabase();

  const top = await Review.aggregate<{
    _id: string;
    averageRating: number;
    totalReviews: number;
    totalLikes: number;
  }>([
    {
      $group: {
        _id: "$productId",
        averageRating: { $avg: "$rating" },
        totalReviews: { $sum: 1 },
        totalLikes: {
          $sum: {
            $cond: [{ $isArray: "$likes" }, { $size: "$likes" }, 0],
          },
        },
      },
    },
    { $sort: { averageRating: -1 } },
    { $limit: 10 },
  ]);

  if (top.length === 0) {
    return [];
  }

  const objectIds = top
    .map((t) => t._id)
    .filter(Boolean)
    .filter((id) => mongoose.Types.ObjectId.isValid(String(id)))
    .map((id) => new mongoose.Types.ObjectId(String(id)));

  const [cars, houses] = await Promise.all([
    objectIds.length > 0
      ? Car.find({ _id: { $in: objectIds } }).lean()
      : Promise.resolve([]),
    objectIds.length > 0
      ? House.find({ _id: { $in: objectIds } }).lean()
      : Promise.resolve([]),
  ]);

  const carMap = new Map(
    cars.map((c) => [String(c._id), c] as const)
  );
  const houseMap = new Map(
    houses.map((h) => [String(h._id), h] as const)
  );

  const featuredProducts: FeaturedProduct[] = [];

  for (const row of top) {
    const pid = String(row._id);
    const car = carMap.get(pid);
    if (car) {
      featuredProducts.push({
        _id: String(car._id),
        productId: String(car._id),
        type: "car",
        name: car.name,
        price: car.price,
        advertisementType: car.advertisementType,
        imageUrl: car.imageUrl || "/placeholder.svg",
        averageRating: row.averageRating,
        totalReviews: row.totalReviews,
        totalLikes: row.totalLikes,
      });
      continue;
    }
    const house = houseMap.get(pid);
    if (house) {
      featuredProducts.push({
        _id: String(house._id),
        productId: String(house._id),
        type: "house",
        name: house.name,
        price: house.price,
        advertisementType: house.advertisementType,
        imageUrl: house.imageUrl || "/placeholder.svg",
        averageRating: row.averageRating,
        totalReviews: row.totalReviews,
        totalLikes: row.totalLikes,
      });
    }
  }

  return featuredProducts;
}

const getCachedFeaturedProducts = unstable_cache(
  computeFeaturedProducts,
  [FEATURED_PRODUCTS_CACHE_TAG],
  { revalidate: REVALIDATE_SEC, tags: [FEATURED_PRODUCTS_CACHE_TAG] }
);

export async function GET(req: NextRequest) {
  return withApiRoute(req, async (innerReq) => {
    const ip = getClientIp(innerReq);
    const limited = checkRateLimit(`featured:${ip}`, 120, 60_000);
    if (!limited.ok) {
      return rateLimitResponse(limited.retryAfterSec);
    }

    try {
      const featuredProducts = await getCachedFeaturedProducts();
      return NextResponse.json(featuredProducts, {
        headers: {
          "Cache-Control": `public, max-age=${CACHE_EXPIRY}, s-maxage=${CACHE_EXPIRY}`,
        },
      });
    } catch (error) {
      console.error("Error fetching featured products:", error);
      return NextResponse.json(
        { error: "Failed to fetch featured products" },
        { status: 500 }
      );
    }
  });
}
