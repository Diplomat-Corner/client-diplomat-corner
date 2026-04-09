import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db-connect";
import Review from "@/lib/models/review.model";
import { auth } from "@clerk/nextjs/server";
import Notification from "@/lib/models/notification.model";

export async function DELETE(
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

    // Check if the user is the owner of the review
    if (review.userId !== userId) {
      return NextResponse.json(
        { error: "Unauthorized - You can only delete your own reviews" },
        { status: 403 }
      );
    }

    // Create notification for target user (seller)
    if (review.targetUserId) {
      try {
        await Notification.create({
          userId: review.targetUserId,
          title: "Review Deleted",
          message: `A review for your product has been deleted.`,
          type: "alert",
          category: "system",
          link: `/product/${review.productId}`,
        });
      } catch (notificationError) {
        console.error("Error creating seller notification:", notificationError);
      }
    }

    await Review.findByIdAndDelete(reviewId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting review:", error);
    return NextResponse.json(
      { error: "Failed to delete review" },
      { status: 500 }
    );
  }
}
