import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db-connect";
import Notification from "@/lib/models/notification.model";
import { cache, CACHE_TTL, CACHE_TAGS, createCacheKey } from "@/lib/cache";

type PushSubscription = {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const lastCheck = searchParams.get("lastCheck");

    if (!userId || !lastCheck) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    const lastCheckDate = new Date(lastCheck);
    if (Number.isNaN(lastCheckDate.getTime())) {
      return NextResponse.json({ error: "Invalid lastCheck" }, { status: 400 });
    }

    await connectToDatabase();

    // Cache push-subscription lookup to reduce DB work on every poll.
    const subscriptionCacheKey = createCacheKey(
      CACHE_TAGS.NOTIFICATIONS,
      "pushSubscription",
      userId
    );

    let pushSubscription = cache.get<PushSubscription>(subscriptionCacheKey);
    if (!pushSubscription?.endpoint) {
      const userNotification = await Notification.findOne({ userId })
        .select("pushSubscription")
        .lean();
      pushSubscription = userNotification?.pushSubscription;

      if (pushSubscription?.endpoint) {
        cache.set(subscriptionCacheKey, pushSubscription, {
          ttl: CACHE_TTL.MEDIUM,
          tags: [CACHE_TAGS.NOTIFICATIONS],
        });
      }
    }

    // Count new notifications
    const count = await Notification.countDocuments({
      userId,
      isRead: false,
      createdAt: { $gt: lastCheckDate },
    });

    const endpoint = pushSubscription?.endpoint;

    // If there are new notifications and user has push subscription
    if (count > 0 && endpoint) {
      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `vapid ${process.env.VAPID_PUBLIC_KEY}`,
          },
          body: JSON.stringify({
            title: "New Notification",
            body: `You have ${count} new notification${count > 1 ? "s" : ""}`,
            icon: "/icon.png",
            badge: "/badge.png",
            data: {
              url: "/notifications",
            },
          }),
        });

        if (!response.ok) {
          console.error(
            "Failed to send push notification:",
            response.statusText
          );
        }
      } catch (error) {
        console.error("Error sending push notification:", error);
      }
    }

    return NextResponse.json({ count });
  } catch (error) {
    console.error("Error checking new notifications:", error);
    return NextResponse.json(
      { error: "Failed to check new notifications" },
      { status: 500 }
    );
  }
}
