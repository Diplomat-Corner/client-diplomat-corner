import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db-connect";
import Review from "@/lib/models/review.model";
import Notification from "@/lib/models/notification.model";
import { auth } from "@clerk/nextjs/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ reviewId: string }> }
) {
  try {
    await connectToDatabase();
    const { userId } = await auth();
    const { reviewId } = await params;

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized - Please sign in" },
        { status: 401 }
      );
    }

    const review = await Review.findById(reviewId);

    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    // Check if user has already liked the review
    const hasLiked = review.likes.includes(userId);

    if (hasLiked) {
      // Remove like
      review.likes = review.likes.filter((id: string) => id !== userId);
    } else {
      // Add like
      review.likes.push(userId);

      // Send notification to review owner
      if (review.userId !== userId) {
        try {
          await Notification.create({
            userId: review.userId,
            title: "New Like on Your Review",
            message: `Someone liked your review.`,
            type: "update",
            category: "system",
            link: `/product/${review.productId}`,
          });
        } catch (error) {
          console.error("Failed to send notification:", error);
        }
      }
    }

    await review.save();

    return NextResponse.json({
      success: true,
      data: {
        likes: review.likes,
      },
    });
  } catch (error) {
    console.error("Error liking review:", error);
    return NextResponse.json(
      { error: "Failed to like review" },
      { status: 500 }
    );
  }
}
