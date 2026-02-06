/**
 * Account Service
 * Handles user profile and account management
 * Includes profile updates, email changes, password changes, etc.
 */

import { prisma } from "@/lib/prisma";
import {
  ForbiddenError,
  NotFoundError,
  ConflictError,
} from "@/lib/api-errors";
import bcrypt from "bcryptjs";
import { VoicePart } from "@/prisma/generated/enums";

// Types for account service
export interface UpdateProfileInput {
  firstName?: string;
  lastName?: string;
  voicePart?: VoicePart;
  instrument?: string;
  districtId?: string;
}

export interface ChangeEmailInput {
  currentPassword: string;
  newEmail: string;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

export interface UserContext {
  id: string;
  email: string;
}

/**
 * GET user account details
 * 
 * @param userId - User ID
 */
export async function getAccountDetails(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
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

  if (!user) {
    throw new NotFoundError("User not found");
  }

  // Convert Date to ISO string for serialization in server actions
  return {
    ...user,
    createdAt: user.createdAt.toISOString(),
  };
}

/**
 * Update user profile information
 * 
 * @param userId - User ID
 * @param input - Profile update input
 */
export async function updateProfile(
  userId: string,
  input: UpdateProfileInput
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new NotFoundError("User not found");
  }

  const updateData: any = {};

  if (input.firstName !== undefined) {
    updateData.firstName = input.firstName;
  }
  if (input.lastName !== undefined) {
    updateData.lastName = input.lastName;
  }
  if (input.voicePart !== undefined) {
    updateData.voicePart = input.voicePart;
  }
  if (input.instrument !== undefined) {
    updateData.instrument = input.instrument;
  }
  if (input.districtId !== undefined) {
    updateData.districtId = input.districtId;
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: updateData,
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
      status: true,
    },
  });

  return {
    user: updatedUser,
    message: "Profile updated successfully",
  };
}

/**
 * Change user email address
 * Requires current password verification
 * 
 * @param userId - User ID
 * @param input - Email change input
 * @throws ConflictError if new email already exists
 * @throws ForbiddenError if password is invalid or user has no password
 */
export async function changeEmail(userId: string, input: ChangeEmailInput) {
  const { currentPassword, newEmail } = input;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      password: true,
    },
  });

  if (!user) {
    throw new NotFoundError("User not found");
  }

  // Ensure user has a password (not OAuth-only)
  if (!user.password) {
    throw new ForbiddenError(
      "Cannot change email for accounts using only social authentication"
    );
  }

  // Verify current password
  const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
  if (!isPasswordValid) {
    throw new ForbiddenError("Invalid password");
  }

  // Check if new email already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: newEmail },
  });

  if (existingUser && existingUser.id !== userId) {
    throw new ConflictError("Email address already in use");
  }

  // Update email and reset verification
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      email: newEmail,
      isVerified: false, // Email needs reverification
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      districtId: true,
      isVerified: true,
    },
  });

  return {
    user: updatedUser,
    message: "Email changed successfully. Please verify your new email address.",
  };
}

/**
 * Change user password
 * Sets isPasswordChangeRequired to false on first password change
 * 
 * @param userId - User ID
 * @param input - Password change input
 * @throws ForbiddenError if current password is invalid or user has no password
 */
export async function changePassword(userId: string, input: ChangePasswordInput) {
  const { currentPassword, newPassword } = input;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      password: true,
      isPasswordChangeRequired: true,
    },
  });

  if (!user) {
    throw new NotFoundError("User not found");
  }

  // Ensure user has a password
  if (!user.password) {
    throw new ForbiddenError(
      "Cannot change password for accounts using only social authentication"
    );
  }

  // Verify current password
  const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
  if (!isPasswordValid) {
    throw new ForbiddenError("Current password is invalid");
  }

  // Hash new password
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  // Update password and mark password change requirement as complete
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      password: hashedPassword,
      isPasswordChangeRequired: false, // Mark as password changed
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      districtId: true,
      isPasswordChangeRequired: true,
    },
  });

  return {
    user: updatedUser,
    message: "Password changed successfully",
  };
}

/**
 * Set password for user (admin/support only)
 * Used for password resets from password reset token
 * 
 * @param userId - User ID
 * @param newPassword - New password to set
 */
export async function setPassword(userId: string, newPassword: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new NotFoundError("User not found");
  }

  // Hash new password
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  // Update password and mark password change requirement as complete
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      password: hashedPassword,
      isPasswordChangeRequired: false, // Password is set
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
    },
  });

  return {
    user: updatedUser,
    message: "Password set successfully",
  };
}

/**
 * Verify user email (used by email verification link)
 * 
 * @param userId - User ID
 */
export async function verifyUserEmail(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new NotFoundError("User not found");
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      isVerified: true,
    },
    select: {
      id: true,
      email: true,
      isVerified: true,
    },
  });

  return {
    user: updatedUser,
    message: "Email verified successfully",
  };
}

/**
 * Get user profile completion status
 * Returns which fields still need to be filled
 * 
 * @param userId - User ID
 */
export async function getProfileCompletionStatus(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      voicePart: true,
      instrument: true,
      districtId: true,
      isVerified: true,
      isPasswordChangeRequired: true,
      status: true,
    },
  });

  if (!user) {
    throw new NotFoundError("User not found");
  }

  // Check which fields are missing
  const missingFields: string[] = [];

  if (!user.firstName || user.firstName.trim() === "") {
    missingFields.push("firstName");
  }
  if (!user.lastName || user.lastName.trim() === "") {
    missingFields.push("lastName");
  }
  if (!user.voicePart) {
    missingFields.push("voicePart");
  }
  if (!user.districtId) {
    missingFields.push("districtId");
  }

  // Check other requirements
  const isComplete =
    missingFields.length === 0 &&
    user.isVerified &&
    !user.isPasswordChangeRequired &&
    user.status === "active";

  return {
    isComplete,
    missingFields,
    requiresEmailVerification: !user.isVerified,
    requiresPasswordChange: user.isPasswordChangeRequired,
    accountStatus: user.status,
  };
}
