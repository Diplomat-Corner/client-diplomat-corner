import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db-connect";
import Advertisement from "@/lib/models/advertisement.model";
import { auth } from "@clerk/nextjs/server";

interface ApiResponse {
  success: boolean;
  error?: string;
  message?: string;
  viewCount?: number;
}

const TRACKING_SLICE = -500;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse>> {
  try {
    const { id } = await params;

    let userId = "anonymous";
    try {
      const authUser = await auth();
      if (authUser.userId) {
        userId = authUser.userId;
      }
    } catch {
      // use anonymous
    }

    const userAgent = request.headers.get("user-agent") || "unknown";
    const ipAddress =
      request.headers.get("x-real-ip") ||
      request.headers.get("x-forwarded-for") ||
      "unknown";

    await connectToDatabase();

    const entry = {
      userId,
      timestamp: new Date(),
      device: userAgent,
      ipAddress,
    };

    const updated = await Advertisement.findByIdAndUpdate(
      id,
      {
        $inc: { viewCount: 1 },
        $push: {
          views: { $each: [entry], $slice: TRACKING_SLICE },
        },
      },
      { new: true, select: "viewCount" }
    );

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Advertisement not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "View recorded successfully",
      viewCount: updated.viewCount,
    });
  } catch (error) {
    console.error("Error recording advertisement view:", error);
    return NextResponse.json(
      { success: false, error: "Failed to record view" },
      { status: 500 }
    );
  }
}
