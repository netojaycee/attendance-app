import { getCurrentUser } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/v1/auth/me
 * Get current authenticated user from cookie
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      data: user,
      message: "User fetched successfully",
    });
  } catch (error) {
    console.error("Error fetching current user:", error);
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 }
    );
  }
}
