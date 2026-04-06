import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db-connect";
import {
  mapClerkUserToCreateDoc,
  mapClerkUserToProfilePatch,
} from "@/lib/clerk-user-sync";
import User from "@/lib/models/user.model";

/**
 * Ensures the signed-in Clerk user has a MongoDB row (heals empty DB / missed webhooks).
 * Identity comes only from the session — never from the request body.
 */
export async function POST() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const existing = await User.findOne({ clerkId: userId });

    if (!existing) {
      const doc = mapClerkUserToCreateDoc(clerkUser);
      const user = await User.create(doc);
      return NextResponse.json({
        created: true,
        user: JSON.parse(JSON.stringify(user)),
      });
    }

    const patch = mapClerkUserToProfilePatch(clerkUser);
    const user = await User.findOneAndUpdate(
      { clerkId: userId },
      patch,
      { new: true }
    );

    return NextResponse.json({
      created: false,
      user: user ? JSON.parse(JSON.stringify(user)) : null,
    });
  } catch (error) {
    console.error("[POST /api/users/sync]", error);
    return NextResponse.json(
      {
        error: "Sync failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
