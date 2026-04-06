import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db-connect";
import Notification from "@/lib/models/notification.model";
import { cache, CACHE_TTL, CACHE_TAGS, createCacheKey } from "@/lib/cache";
import { withApiRoute, getClientIp } from "@/lib/api-observability";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";

type PushSubscription = {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
};

export async function GET(req: NextRequest) {
  return withApiRoute(req, async (innerReq) => {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ip = getClientIp(innerReq);
    const limited = checkRateLimit(`check-new:${ip}`, 90, 60_000);
    if (!limited.ok) {
      return rateLimitResponse(limited.retryAfterSec);
    }

    const { searchParams } = new URL(innerReq.url);
    const lastCheck = searchParams.get("lastCheck");

    if (!lastCheck) {
      return NextResponse.json(
        { error: "Missing required parameter: lastCheck" },
        { status: 400 }
      );
    }

    const lastCheckDate = new Date(lastCheck);
    if (Number.isNaN(lastCheckDate.getTime())) {
      return NextResponse.json({ error: "Invalid lastCheck" }, { status: 400 });
    }

    await connectToDatabase();

    const subscriptionCacheKey = createCacheKey(
      CACHE_TAGS.NOTIFICATIONS,
      "pushSubscription",
      userId
    );

    let pushSubscription: PushSubscription | null | undefined =
      cache.get<PushSubscription>(subscriptionCacheKey);
    if (!pushSubscription?.endpoint) {
      const userNotification = await Notification.findOne({ userId })
        .select("pushSubscription")
        .lean<{ pushSubscription?: PushSubscription } | null>();
      pushSubscription = userNotification?.pushSubscription ?? null;

      if (pushSubscription?.endpoint) {
        cache.set(subscriptionCacheKey, pushSubscription, {
          ttl: CACHE_TTL.MEDIUM,
          tags: [CACHE_TAGS.NOTIFICATIONS],
        });
      }
    }

    const count = await Notification.countDocuments({
      userId,
      isRead: false,
      createdAt: { $gt: lastCheckDate },
    });

    const endpoint = pushSubscription?.endpoint;

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
  });
}
