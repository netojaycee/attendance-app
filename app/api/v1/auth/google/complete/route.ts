import { NextRequest, NextResponse } from "next/server";
import { completeGoogleRegistration } from "@/lib/services/auth.service";
import { VoicePart } from "@/prisma/generated/enums";

/**
 * POST /api/v1/auth/google/complete
 * Complete Google OAuth registration with district and voice part selection
 * 
 * Request body:
 * {
 *   email: string,
 *   firstName: string,
 *   lastName: string,
 *   districtId: string,
 *   voicePart: VoicePart
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const { email, firstName, lastName, districtId, voicePart } = await req.json();

    // Validate required fields
    if (!email || !firstName || !lastName || !districtId || !voicePart) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate voicePart is valid enum
    if (!Object.values(VoicePart).includes(voicePart)) {
      return NextResponse.json(
        { error: "Invalid voice part" },
        { status: 400 }
      );
    }

    // Complete registration
    const result = await completeGoogleRegistration(
      email,
      districtId,
      voicePart,
      firstName,
      lastName
    );

    return NextResponse.json(
      {
        success: true,
        user: result.user,
        message: result.message,
      },
      { status: 201 }
    );
  } catch (error) {
        return NextResponse.json(
          {
            success: false,
            error: error instanceof Error ? error.message : "An unknown error occurred",
          },
          { status: 500 }
        );
  }
}
