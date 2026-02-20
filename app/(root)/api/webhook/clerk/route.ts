import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { connectToDatabase } from "@/lib/db-connect";
import { NextRequest, NextResponse } from "next/server";
import User from "@/lib/models/user.model";
import Car from "@/lib/models/car.model";
import House from "@/lib/models/house.model";
import Notification from "@/lib/models/notification.model";
import Review from "@/lib/models/review.model";
import Report from "@/lib/models/report.model";
import Request from "@/lib/models/request.model";
import Payment from "@/lib/models/payment.model";
import { webhookLogger } from "@/lib/logger";

// Define a more specific type for the Clerk user data
interface ClerkUserData {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email_addresses: Array<{
    email_address: string;
    id: string;
    verification: {
      status: string;
    };
  }>;
  image_url: string | null;
  profile_image_url: string | null;
  external_accounts?: Array<{
    image_url?: string;
  }>;
}

// Explicitly define all the HTTP methods that are allowed
export async function GET() {
  return new NextResponse(
    "Webhook endpoint is working, but expects POST requests",
    { status: 200 }
  );
}

export async function POST(req: NextRequest) {
  webhookLogger.debug("Webhook received: POST request to /api/webhook/clerk");

  const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    webhookLogger.error("WEBHOOK_SECRET is missing from environment variables");
    return new NextResponse("Webhook secret is missing", { status: 500 });
  }

  const svix_id = req.headers.get("svix-id");
  const svix_timestamp = req.headers.get("svix-timestamp");
  const svix_signature = req.headers.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    webhookLogger.error("svix headers are missing");
    return new NextResponse("Error occurred -- no svix headers", {
      status: 400,
    });
  }

  let payload;
  try {
    payload = await req.json();
  } catch (error) {
    webhookLogger.error("Error parsing request body:", error);
    return new NextResponse("Invalid JSON in request body", { status: 400 });
  }

  const body = JSON.stringify(payload);

  // Create a new Svix instance with your secret.
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: WebhookEvent;

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    webhookLogger.error("Error verifying webhook:", err);
    return new NextResponse("Error verifying webhook signature", {
      status: 400,
    });
  }

  const eventType = evt.type;
  webhookLogger.debug(`Received event ${eventType}`);

  if (eventType === "user.created") {
    try {
      // Extract data from the Clerk webhook payload and cast to our interface
      const userData = evt.data as unknown as ClerkUserData;
      const {
        id,
        first_name,
        last_name,
        email_addresses,
        image_url,
        profile_image_url,
        external_accounts,
      } = userData;

      // Get primary email from the email addresses array
      const primaryEmail = email_addresses?.[0]?.email_address || "";

      // Get profile image - try profile_image_url first, then image_url, then from external accounts
      let userImageUrl = profile_image_url || image_url || "";
      if (!userImageUrl && external_accounts?.[0]?.image_url) {
        userImageUrl = external_accounts[0].image_url;
      }

      // Connect to database
      await connectToDatabase();

      try {
        // Try to create new user
        const timestamp = new Date().toISOString();
        const newUser = await User.create({
          clerkId: id,
          email: primaryEmail,
          firstName: first_name || "",
          lastName: last_name || "",
          imageUrl: userImageUrl,
          role: "customer",
          address: "",
          phoneNumber: "",
          timestamp: timestamp,
        });

        webhookLogger.info("User created successfully");
        return NextResponse.json(
          { message: "User created successfully", user: newUser },
          { status: 200 }
        );
      } catch (error) {
        // If error is a duplicate key error
        if (
          error instanceof Error &&
          error.message.includes("duplicate key error")
        ) {
          // Find the existing user with this email
          const existingUser = await User.findOne({ email: primaryEmail });

          if (!existingUser) {
            throw new Error("Duplicate email found but user not found");
          }

          const oldClerkId = existingUser.clerkId;

          // Update the existing user with new Clerk ID and data
          const updatedUser = await User.findOneAndUpdate(
            { email: primaryEmail },
            {
              clerkId: id,
              firstName: first_name || existingUser.firstName,
              lastName: last_name || existingUser.lastName,
              imageUrl: userImageUrl || existingUser.imageUrl,
            },
            { new: true }
          );

          // Update all related records
          const updatePromises = [
            // Update cars
            Car.updateMany({ userId: oldClerkId }, { userId: id }),
            // Update houses
            House.updateMany({ userId: oldClerkId }, { userId: id }),
            // Update notifications
            Notification.updateMany({ userId: oldClerkId }, { userId: id }),
            // Update reviews (both as reviewer and reviewee)
            Review.updateMany({ userId: oldClerkId }, { userId: id }),
            Review.updateMany(
              { targetUserId: oldClerkId },
              { targetUserId: id }
            ),
            // Update reports (both as reporter and reported entity)
            Report.updateMany({ reportedBy: oldClerkId }, { reportedBy: id }),
            Report.updateMany(
              { entityId: oldClerkId, entityType: "user" },
              { entityId: id }
            ),
            // Update requests (both as sender and receiver)
            Request.updateMany({ fromUserId: oldClerkId }, { fromUserId: id }),
            Request.updateMany({ toUserId: oldClerkId }, { toUserId: id }),
            // Update payments
            Payment.updateMany({ userId: oldClerkId }, { userId: id }),
          ];

          // Execute all updates
          await Promise.all(updatePromises);

          webhookLogger.info("User and all related records updated successfully");
          return NextResponse.json(
            {
              message: "User updated successfully",
              user: updatedUser,
              note: "Updated existing user and migrated all associated records",
            },
            { status: 200 }
          );
        }
        throw error; // Re-throw if it's not a duplicate key error
      }
    } catch (error) {
      webhookLogger.error("Error creating/updating user:", error);
      if (error instanceof Error) {
        return NextResponse.json(
          { error: "Failed to create/update user", details: error.message },
          { status: 500 }
        );
      }
      return NextResponse.json(
        {
          error: "Failed to create/update user",
          details: "An unknown error occurred",
        },
        { status: 500 }
      );
    }
  }

  if (eventType === "user.updated") {
    try {
      // Extract data from the Clerk webhook payload and cast to our interface
      const userData = evt.data as unknown as ClerkUserData;
      const {
        id,
        first_name,
        last_name,
        email_addresses,
        image_url,
        profile_image_url,
        external_accounts,
      } = userData;

      // Get primary email from the email addresses array
      const primaryEmail = email_addresses?.[0]?.email_address || "";

      // Get profile image - try profile_image_url first, then image_url, then from external accounts
      let userImageUrl = profile_image_url || image_url || "";
      if (!userImageUrl && external_accounts?.[0]?.image_url) {
        userImageUrl = external_accounts[0].image_url;
      }

      // Connect to database
      await connectToDatabase();

      // Find and update the user
      const updatedUser = await User.findOneAndUpdate(
        { clerkId: id },
        {
          email: primaryEmail,
          firstName: first_name || "",
          lastName: last_name || "",
          imageUrl: userImageUrl,
        },
        { new: true }
      );

      if (!updatedUser) {
        throw new Error("User not found");
      }

      webhookLogger.info("User updated successfully");
      return NextResponse.json(
        { message: "User updated successfully", user: updatedUser },
        { status: 200 }
      );
    } catch (error) {
      webhookLogger.error("Error updating user:", error);
      if (error instanceof Error) {
        return NextResponse.json(
          { error: "Failed to update user", details: error.message },
          { status: 500 }
        );
      }
      return NextResponse.json(
        {
          error: "Failed to update user",
          details: "An unknown error occurred",
        },
        { status: 500 }
      );
    }
  }

  if (eventType === "user.deleted") {
    try {
      // Extract data from the Clerk webhook payload
      const userData = evt.data as unknown as ClerkUserData;
      const { id } = userData;

      // Connect to database
      await connectToDatabase();

      // Find the user first to ensure they exist
      const user = await User.findOne({ clerkId: id });
      if (!user) {
        return NextResponse.json(
          { message: "User not found, nothing to delete" },
          { status: 200 }
        );
      }

      // Delete all related records first
      const deletePromises = [
        // Delete cars
        Car.deleteMany({ userId: id }),
        // Delete houses
        House.deleteMany({ userId: id }),
        // Delete notifications
        Notification.deleteMany({ userId: id }),
        // Delete reviews (both as reviewer and reviewee)
        Review.deleteMany({ userId: id }),
        Review.deleteMany({ targetUserId: id }),
        // Delete reports (both as reporter and reported entity)
        Report.deleteMany({ reportedBy: id }),
        Report.deleteMany({ entityId: id, entityType: "user" }),
        // Delete requests (both as sender and receiver)
        Request.deleteMany({ fromUserId: id }),
        Request.deleteMany({ toUserId: id }),
        // Delete payments
        Payment.deleteMany({ userId: id }),
      ];

      // Execute all deletes
      await Promise.all(deletePromises);

      // Finally delete the user
      await User.deleteOne({ clerkId: id });

      webhookLogger.info("User and all related records deleted successfully");
      return NextResponse.json(
        { message: "User and all related records deleted successfully" },
        { status: 200 }
      );
    } catch (error) {
      webhookLogger.error("Error deleting user:", error);
      if (error instanceof Error) {
        return NextResponse.json(
          { error: "Failed to delete user", details: error.message },
          { status: 500 }
        );
      }
      return NextResponse.json(
        {
          error: "Failed to delete user",
          details: "An unknown error occurred",
        },
        { status: 500 }
      );
    }
  }

  // Return a 200 response for any other event types
  return NextResponse.json(
    { message: `Unhandled event type: ${eventType}` },
    { status: 200 }
  );
}
