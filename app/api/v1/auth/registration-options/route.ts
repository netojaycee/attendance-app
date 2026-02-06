import { NextRequest, NextResponse } from "next/server";
import { getRegistrationOptions } from "@/lib/services/auth.service";

/**
 * GET /api/v1/auth/registration-options
 * Get available districts and voice parts for registration form
 * Used to populate dropdown selections
 */
export async function GET(_req: NextRequest) {
  try {
    const options = await getRegistrationOptions();

    return NextResponse.json(
      {
        success: true,
        data: options,
      },
      { status: 200 },
    );
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
