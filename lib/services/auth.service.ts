/**
 * Auth Service
 * Contains all authentication business logic
 * Handles registration, login, Google OAuth, email verification, and password resets
 */

import { prisma } from "@/lib/prisma";
import {
  ValidationError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
} from "@/lib/api-errors";
import bcrypt from "bcryptjs";
import {
  deleteCookie,
  encryptToken,
  generateRandomPassword,
} from "@/lib/utils";
import { sendPasswordResetEmail } from "@/lib/services/email.service";
import { Role, VoicePart } from "@/prisma/generated/enums";

// Types for auth service
export interface RegistrationInput {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  voicePart: VoicePart;
  districtId: string;
  instrument?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface GoogleProfileInput {
  email: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
}

export interface AuthTokenPayload {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  districtId: string;
  [key: string]: any;
}

/**
 * Register a new user with email and password
 * User status is set to "pending" and requires admin approval
 * Email is marked as unverified
 *
 * @param input - Registration input
 * @throws ConflictError if email already exists
 * @throws ValidationError if input is invalid
 */
export async function registerWithPassword(input: RegistrationInput) {
  const {
    email,
    firstName,
    lastName,
    password,
    voicePart,
    districtId,
    instrument,
  } = input;

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new ConflictError("User with this email already exists");
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create user with pending status and unverified email
  const user = await prisma.user.create({
    data: {
      email,
      firstName,
      lastName,
      voicePart,
      districtId,
      instrument: instrument || null,
      password: hashedPassword,
      role: Role.MEMBER,
      isPasswordChangeRequired: true, // Must change password on first login
      isVerified: false, // Email not verified yet
      status: "pending", // Awaiting admin approval
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      districtId: true,
      isVerified: true,
      status: true,
    },
  });

  return {
    user,
    message:
      "Registration successful. Your account is pending admin approval and you'll receive an email confirmation.",
  };
}

/**
 * Handle Google OAuth - first step
 * Check if user exists or return Google profile for district/voicePart selection
 *
 * @param profile - Google profile
 * @returns userExists flag, user data (if exists), or google profile (if new user)
 * @throws ValidationError if email is missing
 */
export async function handleGoogleAuth(profile: GoogleProfileInput) {
  const { email, given_name = "", family_name = "" } = profile;

  if (!email) {
    throw new ValidationError("Email is required from Google profile");
  }

  // Check if user exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    // User exists - update to mark email as verified via Google
    const user = await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        isVerified: true, // Google auth implies verified
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        districtId: true,
        isVerified: true,
        status: true,
      },
    });

    return {
      userExists: true,
      user,
      message: "Google authentication successful",
    };
  } else {
    // New user - return Google profile for frontend to collect district/voicePart
    return {
      userExists: false,
      googleProfile: {
        email,
        firstName: given_name || "",
        lastName: family_name || "",
      },
      message:
        "Please select your district and voice part to complete registration",
    };
  }
}

/**
 * Complete Google OAuth registration - second step
 * Called after user selects district and voice part from dropdown
 * Creates account with verified email and pending status
 *
 * @param email - User email from Google
 * @param districtId - Selected district ID
 * @param voicePart - Selected voice part
 * @param firstName - User first name from Google
 * @param lastName - User last name from Google
 * @throws ConflictError if email already exists
 * @throws ValidationError if required fields are missing or invalid
 */
export async function completeGoogleRegistration(
  email: string,
  districtId: string,
  voicePart: VoicePart,
  firstName: string,
  lastName: string,
) {
  // Double-check email doesn't exist (in case of race condition)
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new ConflictError("User with this email already exists");
  }

  // Validate district exists
  const district = await prisma.district.findUnique({
    where: { id: districtId },
  });

  if (!district) {
    throw new ValidationError("Invalid district selected");
  }

  // Create user with pending status (awaiting admin approval)
  const user = await prisma.user.create({
    data: {
      email,
      firstName,
      lastName,
      voicePart,
      districtId,
      password: null, // Google OAuth - no password
      role: Role.MEMBER,
      isVerified: true, // Google email is verified
      isPasswordChangeRequired: false, // No password to change for OAuth users
      status: "pending", // Awaiting admin approval
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      districtId: true,
      voicePart: true,
      isVerified: true,
      status: true,
    },
  });

  return {
    user,
    message:
      "Registration successful! Your account is pending admin approval. You'll receive an email notification once approved.",
  };
}

/**
 * Login user with email and password
 * Checks account status and throws error if not active
 *
 * @param input - Login input
 * @throws NotFoundError if user doesn't exist
 * @throws ForbiddenError if password is invalid or account not active
 */
export async function loginWithPassword(input: LoginInput) {
  const { email, password } = input;

  // Find user by email
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      password: true,
      role: true,
      districtId: true,
      status: true,
      isVerified: true,
    },
  });

  if (!user) {
    throw new NotFoundError("Invalid Credentials");
  }

  // Ensure password exists
  if (!user.password) {
    throw new ForbiddenError(
      "Invalid Credentials",
      //   "This account uses Google authentication. Please use Google login."
    );
  }

  // Check account status
  if (user.status !== "active") {
    throw new ForbiddenError(
      `Your account is ${user.status}. Please contact an administrator.`,
    );
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw new ForbiddenError("Invalid Credentials");
  }

  // Create auth token
  const tokenPayload: AuthTokenPayload = {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    districtId: user.districtId,
  };

  const token = await encryptToken(tokenPayload, "7d");

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      districtId: user.districtId,
    },
    message: "Login successful",
  };
}

/**
 * Login user with Google OAuth
 * Checks account status and throws error if not active
 *
 * @param profile - Google profile
 * @throws NotFoundError if user doesn't exist
 * @throws ForbiddenError if account not active
 */
export async function loginWithGoogle(profile: GoogleProfileInput) {
  const { email } = profile;

  if (!email) {
    throw new ValidationError("Email is required from Google profile");
  }

  // Find user by email
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      districtId: true,
      status: true,
      isVerified: true,
    },
  });

  if (!user) {
    throw new NotFoundError(
      "Account not found. Please register first or contact your administrator.",
    );
  }

  // Check account status
  if (user.status !== "active") {
    throw new ForbiddenError(
      `Your account is ${user.status}. Please contact an administrator.`,
    );
  }

  // Mark email as verified if not already
  if (!user.isVerified) {
    await prisma.user.update({
      where: { id: user.id },
      data: { isVerified: true },
    });
  }

  // Create auth token
  const tokenPayload: AuthTokenPayload = {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    districtId: user.districtId,
  };

  const token = await encryptToken(tokenPayload, "7d");

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      districtId: user.districtId,
    },
    message: "Google login successful",
  };
}

/**
 * Verify user email
 * Called after user clicks email verification link
 * Auto-logs user in by creating auth token
 *
 * @param token - Email verification token
 */
export async function verifyEmail(token: string) {
  // Find magic link token
  const magicLink = await prisma.magicLinkToken.findUnique({
    where: { token },
    select: {
      id: true,
      email: true,
      expiresAt: true,
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          districtId: true,
          status: true,
        },
      },
    },
  });

  if (!magicLink) {
    throw new NotFoundError("Invalid or expired verification link");
  }

  // Check expiration
  if (new Date() > magicLink.expiresAt) {
    // Delete expired token
    await prisma.magicLinkToken.delete({ where: { id: magicLink.id } });
    throw new ValidationError("Verification link has expired");
  }

  // Find or create user from email
  let user = magicLink.user;
  if (!user) {
    throw new NotFoundError("User not found");
  }

  // Mark email as verified
  user = await prisma.user.update({
    where: { id: user.id },
    data: { isVerified: true },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      districtId: true,
      status: true,
    },
  });

  // Delete the used token
  await prisma.magicLinkToken.delete({ where: { id: magicLink.id } });

  if (!user) {
    throw new NotFoundError("User not found");
  }
  // Create auth token
  const tokenPayload: AuthTokenPayload = {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    districtId: user.districtId,
  };

  const authToken = await encryptToken(tokenPayload, "7d");

  return {
    token: authToken,
    user,
    message: "Email verified successfully",
  };
}

/**
 * Request password reset
 * Generates token and sends reset email
 *
 * @param email - User email
 */
export async function requestPasswordReset(email: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      firstName: true,
      email: true,
    },
  });

  if (!user) {
    // Don't reveal if email exists
    return {
      message: "If account exists, password reset email has been sent",
    };
  }

  // Generate reset token (valid for 1 hour)
  const resetToken = generateRandomPassword();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      token: resetToken,
      expiresAt,
    },
  });

  // Send reset email
  try {
    await sendPasswordResetEmail(user.email, user.firstName, resetToken);
  } catch (error) {
    console.error("Failed to send password reset email:", error);
    // Don't fail the request
  }

  return {
    message: "If account exists, password reset email has been sent",
  };
}

/**
 * Reset password with token
 *
 * @param token - Password reset token
 * @param newPassword - New password
 */
export async function resetPassword(token: string, newPassword: string) {
  // Find reset token
  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token },
    select: {
      id: true,
      userId: true,
      expiresAt: true,
    },
  });

  if (!resetToken) {
    throw new NotFoundError("Invalid or expired reset link");
  }

  // Check expiration
  if (new Date() > resetToken.expiresAt) {
    await prisma.passwordResetToken.delete({ where: { id: resetToken.id } });
    throw new ValidationError("Reset link has expired");
  }

  // Hash new password
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  // Update user password and delete token
  const user = await prisma.user.update({
    where: { id: resetToken.userId },
    data: {
      password: hashedPassword,
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      districtId: true,
    },
  });

  // Delete all reset tokens for this user
  await prisma.passwordResetToken.deleteMany({
    where: { userId: user.id },
  });

  return {
    message: "Password reset successful. Please login with your new password.",
  };
}

/**
 * Logout user (clears auth cookie)
 * Returns cookie header strings for API route to set
 */
export function logout() {
  const userCookie = process.env.NEXT_PUBLIC_COOKIE_NAME!;

  // Generate cookie clear directives
  const userClear = deleteCookie(userCookie);

  return {
    message: "Logout successful",
    cookies: [userClear].filter(Boolean),
  };
}

/**
 * Get available districts and voice parts for registration form
 * Called by frontend to populate dropdown selections
 *
 * @returns Districts and voice parts for user selection
 */
export async function getRegistrationOptions() {
  const districts = await prisma.district.findMany({
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  const voiceParts = Object.values(VoicePart);

  return {
    districts,
    voiceParts,
  };
}
