import { cookies } from "next/headers";
import { decryptToken } from "@/lib/utils";
import { prisma } from "@/lib/prisma";

const userCookieName = process.env.NEXT_PUBLIC_COOKIE_NAME!;

/**
 * Get current authenticated user
 * Validates token and fetches fresh user data from database
 * If user doesn't exist, clears the token
 * 
 * @returns User object with all profile fields, or null if not authenticated
 */
export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const userToken = cookieStore.get(userCookieName)?.value;

    if (!userToken) {
      return null;
    }

    // Decrypt token to get user ID
    const tokenData = await decryptToken<{ id: string }>(userToken);
    
    if (!tokenData?.id) {
      // Invalid token, clear it
      cookieStore.delete(userCookieName);
      return null;
    }

    // Fetch fresh user data from database
    const user = await prisma.user.findUnique({
      where: { id: tokenData.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        voicePart: true,
        instrument: true,
        districtId: true,
        role: true,
        isVerified: true,
        isPasswordChangeRequired: true,
        status: true,
        createdAt: true,
      },
    });

    // User no longer exists, clear invalid token
    if (!user) {
      cookieStore.delete(userCookieName);
      return null;
    }

    // Convert Date to ISO string for serialization
    return {
      ...user,
      createdAt: user.createdAt.toISOString(),
    };
  } catch (error) {
    console.error("Failed to get current user:", error);
    return null;
  }
}

/**
 * Get app session - wrapper for getCurrentUser with destructurable format
 * @returns { user } object or { user: null }
 */
export async function getAppSession() {
  const user = await getCurrentUser();
  return { user };
}
