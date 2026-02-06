"use server";

/**
 * Account Server Actions
 * Client-facing actions for user account and profile management
 */

import { getCurrentUser } from "@/lib/session";
import {
  updateProfile,
  changeEmail,
  changePassword,
  getProfileCompletionStatus,
} from "@/lib/services/account.service";
import { VoicePart } from "@/prisma/generated/enums";

/**
 * Get current user's account details
 */
export async function getAccountDetailsAction() {
  try {
    const user = await getCurrentUser();

    if (!user?.id) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    return {
      success: true,
      data: user,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch account details",
    };
  }
}

/**
 * Update user profile
 */
export async function updateProfileAction(
  firstName?: string,
  lastName?: string,
  voicePart?: VoicePart,
  instrument?: string,
  districtId?: string,
) {
  try {
    const user = await getCurrentUser();

    if (!user?.id) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    const result = await updateProfile(user.id, {
      firstName,
      lastName,
      voicePart,
      instrument,
      districtId,
    });

    return {
      success: true,
      data: result.user,
      message: result.message,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update profile",
    };
  }
}

/**
 * Change user email
 */
export async function changeEmailAction(
  newEmail: string,
  currentPassword: string,
) {
  try {
    const user = await getCurrentUser();

    if (!user?.id) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    const result = await changeEmail(user.id, {
      newEmail,
      currentPassword,
    });

    return {
      success: true,
      data: result.user,
      message: result.message,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to change email",
    };
  }
}

/**
 * Change user password
 */
export async function changePasswordAction(
  currentPassword: string,
  newPassword: string,
) {
  try {
    const user = await getCurrentUser();

    if (!user?.id) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    const result = await changePassword(user.id, {
      currentPassword,
      newPassword,
    });

    return {
      success: true,
      data: result.user,
      message: result.message,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to change password",
    };
  }
}

/**
 * Get user's profile completion status
 */
export async function getProfileCompletionStatusAction() {
  try {
    const user = await getCurrentUser();

    if (!user?.id) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    const status = await getProfileCompletionStatus(user.id);

    return {
      success: true,
      data: status,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch completion status",
    };
  }
}
