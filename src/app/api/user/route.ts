import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";

/**
 * GET /api/user
 * Get current user information
 */
export async function GET() {
  try {
    // Check if user is authenticated
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get full user object
    const user = await currentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Return user information
    return NextResponse.json({
      id: user.id,
      email: user.emailAddresses[0]?.emailAddress,
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      imageUrl: user.imageUrl,
      createdAt: user.createdAt,
      publicMetadata: user.publicMetadata,
    });
  } catch (error) {
    console.error("Error in GET /api/user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/user
 * Update user metadata (example)
 */
export async function PATCH(request: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Here you would typically update user data in your database
    // For this example, we'll just return the data
    
    return NextResponse.json({
      message: "User updated successfully",
      data: body,
    });
  } catch (error) {
    console.error("Error in PATCH /api/user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}