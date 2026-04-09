import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import Notification from "@/lib/models/notification.model";
import { connectToDatabase } from "@/lib/db-connect";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();

    // Get the authenticated user
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { message: "Notification ID is required" },
        { status: 400 }
      );
    }

    // Find the notification
    const notification = await Notification.findById(id);

    if (!notification) {
      return NextResponse.json(
        { message: "Notification not found" },
        { status: 404 }
      );
    }

    // Check if the user owns the notification
    if (notification.userId !== userId) {
      return NextResponse.json(
        { message: "Unauthorized to delete this notification" },
        { status: 403 }
      );
    }

    // Delete the notification
    await Notification.findByIdAndDelete(id);

    return NextResponse.json(
      { message: "Notification deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting notification:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
