import { NextResponse } from "next/server";
import { getHomeAdvertisements } from "@/lib/actions/advertisements.actions";

export async function GET() {
  try {
    const data = await getHomeAdvertisements();
    return NextResponse.json({ success: true, ...data });
  } catch (error) {
    console.error("Error fetching home advertisements:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
