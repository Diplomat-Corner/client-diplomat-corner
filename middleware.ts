import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

/** Set to `true` to show the maintenance page for all routes except `/maintenance`. */
export const MAINTENANCE_MODE = true;

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
  if (MAINTENANCE_MODE) {
    const path = req.nextUrl.pathname;
    if (path !== "/maintenance") {
      return NextResponse.rewrite(new URL("/maintenance", req.url));
    }
  }

  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
