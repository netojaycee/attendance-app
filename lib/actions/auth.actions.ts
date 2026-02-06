"use server";

/**
 * Auth Server Actions
 * Client-facing actions for authentication operations
 */

import {
  registerWithPassword,
  loginWithPassword,
  handleGoogleAuth,
  completeGoogleRegistration,
  verifyEmail,
  requestPasswordReset,
  resetPassword,
  logout,
  getRegistrationOptions,
} from "@/lib/services/auth.service";
import { getCurrentUser } from "@/lib/session";
import { VoicePart } from "@/prisma/generated/enums";
import { cookies } from "next/headers";
import { encryptToken } from "@/lib/utils";

/**
 * Register user with email and password
 */
export async function registerAction(
  email: string,
  firstName: string,
  lastName: string,
  password: string,
  voicePart: VoicePart,
  districtId: string,
  instrument?: string
) {
  try {
    const result = await registerWithPassword({
      email,
      firstName,
      lastName,
      password,
      voicePart,
      districtId,
      instrument,
    });

    return {
      success: true,
      data: result.user,
      message: result.message,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Registration failed",
    };
  }
}

/**
 * Login user with email and password
 */
export async function loginAction(email: string, password: string) {
  try {
    const result = await loginWithPassword({ email, password });

    // Set auth cookie
    const cookieStore = await cookies();
    cookieStore.set(process.env.NEXT_PUBLIC_COOKIE_NAME!, result.token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    return {
      success: true,
      data: result.user,
      message: result.message,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Login failed",
    };
  }
}

/**
 * Handle Google OAuth - check if user exists
 */
export async function handleGoogleAuthAction(
  email: string,
  given_name: string,
  family_name: string
) {
  try {
    const result = await handleGoogleAuth({
      email,
      given_name,
      family_name,
    });

    if (result.userExists && result.user) {
      // Set auth cookie for existing user
      const token = await encryptToken(result.user, "7d");
      const cookieStore = await cookies();
      cookieStore.set(process.env.NEXT_PUBLIC_COOKIE_NAME!, token, {
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60, // 7 days
        path: "/",
      });

      return {
        success: true,
        userExists: true,
        data: result.user,
        message: result.message,
      };
    }

    // New user - return profile for form
    const options = await getRegistrationOptions();
    return {
      success: true,
      userExists: false,
      googleProfile: result.googleProfile,
      registrationOptions: options,
      message: result.message,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Google auth failed",
    };
  }
}

/**
 * Complete Google OAuth registration
 */
export async function completeGoogleRegistrationAction(
  email: string,
  districtId: string,
  voicePart: VoicePart,
  firstName: string,
  lastName: string
) {
  try {
    const result = await completeGoogleRegistration(
      email,
      districtId,
      voicePart,
      firstName,
      lastName
    );

    return {
      success: true,
      data: result.user,
      message: result.message,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Registration failed",
    };
  }
}

/**
 * Verify email with token
 */
export async function verifyEmailAction(token: string) {
  try {
    const result = await verifyEmail(token);

    // Set auth cookie
    const cookieStore = await cookies();
    cookieStore.set(process.env.NEXT_PUBLIC_COOKIE_NAME!, result.token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    return {
      success: true,
      data: result.user,
      message: result.message,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Email verification failed",
    };
  }
}

/**
 * Request password reset email
 */
export async function requestPasswordResetAction(email: string) {
  try {
    const result = await requestPasswordReset(email);

    return {
      success: true,
      message: result.message,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Password reset request failed",
    };
  }
}

/**
 * Reset password with token
 */
export async function resetPasswordAction(token: string, newPassword: string) {
  try {
    const result = await resetPassword(token, newPassword);

    return {
      success: true,
      message: result.message,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Password reset failed",
    };
  }
}

/**
 * Logout user
 */
export async function logoutAction() {
  try {
    const result = logout();

    // Clear auth cookies
    const cookieStore = await cookies();
    cookieStore.delete(process.env.NEXT_PUBLIC_COOKIE_NAME!);
    if (process.env.NEXT_PUBLIC_GUEST_COOKIE_NAME) {
      cookieStore.delete(process.env.NEXT_PUBLIC_GUEST_COOKIE_NAME);
    }

    return {
      success: true,
      message: result.message,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Logout failed",
    };
  }
}

/**
 * Get registration options (districts and voice parts)
 */
export async function getRegistrationOptionsAction() {
  try {
    const options = await getRegistrationOptions();

    return {
      success: true,
      data: options,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load registration options",
    };
  }
}

/**
 * Get current authenticated user
 */
export async function getCurrentUserAction() {
  try {
   const user = await getCurrentUser();
    return {
      success: true,
      data: user,
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : "Failed to get current user",
    };
  }
}
