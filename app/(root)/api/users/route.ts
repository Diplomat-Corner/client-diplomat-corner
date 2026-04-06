import { connectToDatabase } from "@/lib/db-connect";
import User from "@/lib/models/user.model";
import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";


// Get all users (with optional query filters)
export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    // Get query parameters
    const url = new URL(req.url);
    const clerkId = url.searchParams.get("clerkId");
    const email = url.searchParams.get("email");
    const role = url.searchParams.get("role");
    
    const limit = parseInt(url.searchParams.get("limit") || "50");
    const skip = parseInt(url.searchParams.get("skip") || "0");
    // Build query based on provided parameters
    const query: Record<string, string> = {};
    if (clerkId) query.clerkId = clerkId;
    if (email) query.email = email;
    if (role) query.role = role;
  

    // Fetch users with pagination
    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);

    const total = await User.countDocuments(query);
    
    return NextResponse.json({
      users,
      pagination: {
        total,
        count: users.length,
        limit,
        skip,
      },
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch users",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    await connectToDatabase();

    const userData = await req.json();

    if (!userData.clerkId || !userData.email || !userData.firstName) {
      return NextResponse.json(
        { error: "Missing required user data" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await User.findOne({ clerkId: userData.clerkId });
    if (existingUser) {
      return NextResponse.json(
        { error: "User with this Clerk ID already exists" },
        { status: 409 }
      );
    }

    // Create timestamp in ISO format
    const timestamp = new Date().toISOString();

    // Create new user with required fields
    const newUser = await User.create({
      clerkId: userData.clerkId,
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      imageUrl: userData.imageUrl || "",
      role: userData.role || "customer",
      address: userData.address || "",
      phoneNumber: "",
      timestamp: timestamp,
    });

    return NextResponse.json(
      { message: "User created successfully", user: newUser },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating user:", error);
    if (error instanceof Error) {
      return NextResponse.json(
        { error: "Failed to create user", details: error.message },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create user", details: "An unknown error occurred" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    await connectToDatabase();
    const { userId } = await auth();
    const user = await currentUser();
    const { phoneNumber } = await req.json();

    if (!userId || !user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!phoneNumber) {
      return new NextResponse("Phone number is required", { status: 400 });
    }

    // First check if user exists
    let existingUser = await User.findOne({ clerkId: userId });

    if (!existingUser) {
      // Create new user with required fields from Clerk
      existingUser = await User.create({
        clerkId: userId,
        email: user.emailAddresses[0].emailAddress,
        firstName: user.firstName || "User",
        lastName: user.lastName,
        imageUrl: user.imageUrl,
        phoneNumber,
        timestamp: new Date().toISOString(),
        role: "customer"
      });
    } else {
      // Update existing user's phone number
      existingUser = await User.findOneAndUpdate(
        { clerkId: userId },
        { phoneNumber },
        { new: true }
      );
    }

    return NextResponse.json(existingUser);
  } catch (error) {
    console.error("[USER_PHONE_UPDATE]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

// Delete a user
export async function DELETE(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    // Get the clerk ID from the URL query parameter
    const url = new URL(req.url);
    const clerkId = url.searchParams.get("clerkId");

    if (!clerkId) {
      return NextResponse.json(
        { error: "Clerk ID is required" },
        { status: 400 }
      );
    }

    // Find and delete the user
    const deletedUser = await User.findOneAndDelete({ clerkId });

    if (!deletedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      message: "User deleted successfully",
      user: {
        clerkId: deletedUser.clerkId,
        email: deletedUser.email,
        firstName: deletedUser.firstName,
        lastName: deletedUser.lastName,
      },
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      {
        error: "Failed to delete user",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
