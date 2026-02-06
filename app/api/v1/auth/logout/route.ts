import { NextRequest, NextResponse } from "next/server";
import { logout } from "@/lib/services/auth.service";

/**
 * POST /api/v1/auth/logout
 * Logout user and clear auth cookies
 */
export async function POST(_req: NextRequest) {
  try {
    // Call auth service logout
    const result = logout();

    // Create response with cookie clear headers
    const response = new NextResponse(
      JSON.stringify({
        success: true,
        message: result.message,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    // Add all cookie clear directives to response
    if (result.cookies && result.cookies.length > 0) {
      result.cookies.forEach((cookie) => {
        response.headers.append("Set-Cookie", cookie);
      });
    }

    return response;
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "An unknown error occurred",
      },
      { status: 500 },
    );
  }
}
