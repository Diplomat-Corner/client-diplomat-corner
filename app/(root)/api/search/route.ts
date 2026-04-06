import { connectToDatabase } from "@/lib/db-connect";
import Car from "@/lib/models/car.model";
import House from "@/lib/models/house.model";
import { NextRequest, NextResponse } from "next/server";
import { withApiRoute, getClientIp } from "@/lib/api-observability";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  return withApiRoute(req, async (innerReq) => {
    const ip = getClientIp(innerReq);
    const limited = checkRateLimit(`search:${ip}`, 60, 60_000);
    if (!limited.ok) {
      return rateLimitResponse(limited.retryAfterSec);
    }

    const { searchParams } = new URL(innerReq.url);
    const query = searchParams.get("query");
    const category = searchParams.get("category") || "all";

    if (!query || typeof query !== "string") {
      return NextResponse.json(
        { error: "Query parameter is required and must be a string" },
        { status: 400 }
      );
    }

    const validCategories = ["all", "cars", "houses"];
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { error: 'Invalid category. Use "all", "cars", or "houses"' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    try {
      let cars: Array<ReturnType<typeof Car.prototype.toObject>> = [];
      let houses: Array<ReturnType<typeof House.prototype.toObject>> = [];

      if (category === "cars") {
        cars = await Car.find(
          { $text: { $search: query } },
          { score: { $meta: "textScore" } }
        )
          .sort({ score: { $meta: "textScore" } })
          .limit(10)
          .lean();
      }

      if (category === "houses") {
        houses = await House.find(
          { $text: { $search: query } },
          { score: { $meta: "textScore" } }
        )
          .sort({ score: { $meta: "textScore" } })
          .limit(10)
          .lean();
      }

      if (category === "all") {
        cars = await Car.find(
          { $text: { $search: query } },
          { score: { $meta: "textScore" } }
        )
          .sort({ score: { $meta: "textScore" } })
          .limit(10)
          .lean();

        houses = await House.find(
          { $text: { $search: query } },
          { score: { $meta: "textScore" } }
        )
          .sort({ score: { $meta: "textScore" } })
          .limit(10)
          .lean();
      }

      const results = [
        ...cars.map((car) => ({ id: car._id, name: car.name, type: "car" })),
        ...houses.map((house) => ({
          id: house._id,
          name: house.name,
          type: "house",
        })),
      ];

      return NextResponse.json(results);
    } catch (error) {
      console.error("Search error:", error);
      return NextResponse.json(
        { error: "Internal Server Error" },
        { status: 500 }
      );
    }
  });
}
