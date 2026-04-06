import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

/** Set to `true` to show the maintenance page for all routes except `/maintenance`. */
export const MAINTENANCE_MODE = false;

// This example protects all routes including api/trpc routes

const isPublicRoute = createRouteMatcher([
  "/maintenance",
  "/",
  "/car",
  "/house",
  "/car-for-sale",
  "/house-for-rent",
  "/car-for-rent",
  "/about-us",
  "/contact-us",
  "/api/cars(.*)",
  "/api/house(.*)",
  "/api/featured-products(.*)",
  "/api/advertisements(.*)",
  "/api/reviews(.*)",
  "/api/requests(.*)",
  "/api/messages(.*)",
  "/api/notifications(.*)",
  "/api/reports(.*)",
  "/api/search(.*)",
  "/api/users(.*)",
  "/api/webhook(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/car/:id",
  "/house/:id",
  "/privacy-policy",
  "/terms-of-service",
]);

export default clerkMiddleware(async (auth, req) => {
  const pathname = req.nextUrl.pathname;

  if (
    process.env.NODE_ENV === "production" &&
    pathname.startsWith("/api/webhook/test")
  ) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const requestId = req.headers.get("x-request-id") ?? crypto.randomUUID();
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-request-id", requestId);

  if (MAINTENANCE_MODE) {
    if (pathname !== "/maintenance") {
      const res = NextResponse.rewrite(new URL("/maintenance", req.url));
      res.headers.set("x-request-id", requestId);
      return res;
    }
  }

  if (!isPublicRoute(req)) {
    await auth.protect();
  }

  if (pathname.startsWith("/api")) {
    console.log(
      JSON.stringify({
        ts: new Date().toISOString(),
        type: "api_request",
        phase: "start",
        requestId,
        method: req.method,
        path: pathname,
      })
    );
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
