/**
 * Users Service
 * Contains all business logic for user operations
 */

import { prisma } from "@/lib/prisma";
import {
  ValidationError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
} from "@/lib/api-errors";
import { hash } from "bcryptjs";
import {
  sendUserInviteEmail,
  sendBulkUserInviteEmails,
} from "@/lib/services/email.service";
import { generateRandomPassword } from "@/lib/utils";
import { Role, VoicePart } from "@/prisma/generated/enums";

// Types for service methods
export interface CreateUserInput {
  email: string;
  firstName: string;
  lastName: string;
  voicePart: VoicePart;
  districtId: string;
  instrument?: string;
  role?: Role;
}

export interface BulkUserInput {
  email: string;
  firstName: string;
  lastName: string;
  voicePart: VoicePart;
  districtId: string;
  role?: Role;
  instrument?: string;
}

export interface UserContext {
  id: string;
  role: Role;
  districtId: string | null;
}

/**
 * GET /api/v1/users
 * List users with filters and authorization
 */
export async function getUsers(
  user: UserContext,
  filters?: {
    districtId?: string;
    role?: string;
    voicePart?: string;
    search?: string;
    status?: string;
  }
) {
  // Check if user can access this district
  if (filters?.districtId && user.role !== Role.ADMIN) {
    throw new ForbiddenError("Can only filter by your own district");
  }

  const where: any = {};

  // Apply filters based on user role
  if (user.role !== Role.ADMIN) {
    // Non-admin can only see their district
    where.districtId = user.districtId;
  } else if (filters?.districtId) {
    // Admin filtering by district
    where.districtId = filters.districtId;
  }

  if (filters?.role) where.role = filters.role;
  if (filters?.voicePart) where.voicePart = filters.voicePart;
  if (filters?.status) where.status = filters.status;
  // Search by first name or last name
  if (filters?.search) {
    where.OR = [
      { firstName: { contains: filters.search, mode: "insensitive" } },
      { lastName: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  const users = await prisma.user.findMany({
    where,
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      voicePart: true,
      instrument: true,
      role: true,
      districtId: true,
      createdAt: true,
      district: {
        select: { name: true },
      },
    },
    orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
  });

  return users;
}

/**
 * GET /api/v1/users/pending
 * List pending users awaiting confirmation
 */
export async function getPendingUsers(user: UserContext) {
  // Only admins and district leaders can view pending users
  if (user.role !== Role.ADMIN && user.role !== Role.DISTRICT_LEADER) {
    return [];
  }

  const where: any = {
    isVerified: false,
  };

  // District leaders only see pending users in their district
  if (user.role === Role.DISTRICT_LEADER) {
    where.districtId = user.districtId;
  }

  const pendingUsers = await prisma.user.findMany({
    where,
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      voicePart: true,
      districtId: true,
      createdAt: true,
      district: {
        select: { name: true },
      },
    },
    orderBy: [{ createdAt: "desc" }],
  });

  return pendingUsers.map((user) => ({
    ...user,
    createdAt: user.createdAt.toISOString(),
  }));
}

/**
 * POST /api/v1/users
 * Create a new user with email invitation
 */
export async function createUser(
  input: CreateUserInput,
  user: UserContext
) {
  const {
    email,
    firstName,
    lastName,
    voicePart,
    districtId,
    instrument,
    role = Role.MEMBER,
  } = input;

  // Check if user is admin or district leader for the target district
  if (user.role === Role.DISTRICT_LEADER && user.districtId !== districtId) {
    throw new ForbiddenError("Can only create users in your district");
  }

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new ConflictError("User with this email already exists");
  }

  // Generate random password and hash it
  // const randomPassword = generateRandomPassword();
  const randomPassword = 'password123'; // TODO: Remove hardcoded password and use generated one
  const hashedPassword = await hash(randomPassword, 10);

  // Create user
  const newUser = await prisma.user.create({
    data: {
      email,
      firstName,
      lastName,
      voicePart,
      instrument: instrument || null,
      role,
      districtId,
      password: hashedPassword,
      isVerified: true, // Admin-created users have verified emails
      status: "active", // Admin-created users are immediately active
      isPasswordChangeRequired: true, // Must change password on first login
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      voicePart: true,
      role: true,
      districtId: true,
    },
  });

  // Send invitation email with password and login link
  try {
    await sendUserInviteEmail(email, firstName, randomPassword);
  } catch (emailError) {
    console.error("Failed to send invitation email:", emailError);
    // Don't fail the request, user was created
  }

  return {
    user: newUser,
    message: "User created successfully. Invitation email sent.",
  };
}

/**
 * DELETE /api/v1/users/[userId]
 * Delete a user with authorization
 */
export async function deleteUser(userId: string, user: UserContext) {
  // Get the target user
  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      districtId: true,
      role: true,
    },
  });

  if (!targetUser) {
    throw new NotFoundError("User not found");
  }

  // Authorization checks
  if (user.role === Role.DISTRICT_LEADER) {
    // District leaders can only delete users in their district
    if (targetUser.districtId !== user.districtId) {
      throw new ForbiddenError("You can only delete users in your district");
    }
    // District leaders cannot delete admins
    if (targetUser.role === Role.ADMIN) {
      throw new ForbiddenError("You cannot delete administrators");
    }
  }

  // Delete user
  await prisma.user.delete({
    where: { id: userId },
  });

  return {
    message: `User ${targetUser.firstName} ${targetUser.lastName} deleted successfully`,
  };
}

/**
 * POST /api/v1/users/bulk-upload
 * Bulk upload users from array
 */
export async function bulkUploadUsers(
  districtId: string,
  users: BulkUserInput[],
  user: UserContext
) {
  // Validate districtId is provided
  if (!districtId || districtId.trim() === "") {
    throw new ValidationError("District ID is required");
  }

  // Check authorization: District leaders can only upload to their district
  if (
    user.role === Role.DISTRICT_LEADER &&
    user.districtId !== districtId
  ) {
    throw new ForbiddenError("You can only upload users to your district");
  }

  if (users.length === 0) {
    throw new ValidationError("No users to import");
  }

  // Validate all users
  const validationErrors: Array<{ row: number; error: string }> = [];
  const validUsers: Array<BulkUserInput & { row: number }> = [];

  for (let i = 0; i < users.length; i++) {
    const userData = { ...users[i], districtId };

    // Basic validation
    if (!userData.email) {
      validationErrors.push({
        row: i + 2,
        error: "Email is required",
      });
      continue;
    }

    if (!userData.firstName) {
      validationErrors.push({
        row: i + 2,
        error: "First name is required",
      });
      continue;
    }

    if (!userData.lastName) {
      validationErrors.push({
        row: i + 2,
        error: "Last name is required",
      });
      continue;
    }

    if (!userData.voicePart) {
      validationErrors.push({
        row: i + 2,
        error: "Voice part is required",
      });
      continue;
    }

    validUsers.push({
      ...userData,
      row: i + 2,
    });
  }

  // Check for duplicate emails within the import
  const emails = validUsers.map((u) => u.email);
  const duplicates = emails.filter((e, i) => emails.indexOf(e) !== i);

  if (duplicates.length > 0) {
    duplicates.forEach((email) => {
      const indices = emails
        .map((e, i) => (e === email ? i : -1))
        .filter((i) => i >= 0);
      indices.forEach((idx) => {
        validationErrors.push({
          row: validUsers[idx].row,
          error: `Duplicate email: ${email}`,
        });
      });
    });
  }

  // Filter out duplicates from validUsers
  const nonDuplicateUsers = validUsers.filter(
    (u) => !duplicates.includes(u.email)
  );

  // Check if emails already exist in database
  const existingEmails = await prisma.user.findMany({
    where: {
      email: {
        in: nonDuplicateUsers.map((u) => u.email),
      },
    },
    select: { email: true },
  });

  const existingEmailSet = new Set(existingEmails.map((u) => u.email));

  const finalUsers = nonDuplicateUsers.filter((u) => {
    if (existingEmailSet.has(u.email)) {
      validationErrors.push({
        row: u.row,
        error: `Email already exists: ${u.email}`,
      });
      return false;
    }
    return true;
  });

  if (finalUsers.length === 0) {
    throw new ValidationError(
      `No valid users to import. ${validationErrors.length} errors found.`
    );
  }

  // Create users
  const createdUsers: Array<{
    email: string;
    firstName: string;
    lastName: string;
  }> = [];
  const usersForEmailInvite: Array<{
    email: string;
    firstName: string;
    password: string;
  }> = [];
  const creationErrors: Array<{ row: number; error: string }> = [];

  for (const userData of finalUsers) {
    try {
      // Generate password and hash it
      const randomPassword = generateRandomPassword();
      const hashedPassword = await hash(randomPassword, 10);

      const newUser = await prisma.user.create({
        data: {
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          voicePart: userData.voicePart,
          role: (userData.role as Role) || Role.MEMBER,
          districtId: userData.districtId,
          instrument: userData.instrument || null,
          password: hashedPassword,
            isVerified: true, // Admin bulk-created users have verified emails
            status: "active", // Admin bulk-created users are immediately active
            isPasswordChangeRequired: true, // Must change password on first login
        },
      });

       usersForEmailInvite.push({
        email: newUser.email,
        firstName: newUser.firstName,
        password: randomPassword,
      });

      
    } catch (error) {
      creationErrors.push({
        row: userData.row,
        error: error instanceof Error ? error.message : "Failed to create user",
      });
    }
  }

  // Send all invitation emails in bulk with rate limiting and retry logic
  let emailResults = { sent: 0, failed: 0, errors: [] as Array<{ email: string; error: string }> };
  if (usersForEmailInvite.length > 0) {
    try {
      emailResults = await sendBulkUserInviteEmails(usersForEmailInvite);
    } catch (error) {
      console.error("Error during bulk email sending:", error);
      // Don't fail the whole operation, but report in errors
    }
  }

  // Add email errors to final errors list
  const allErrors = [
    ...validationErrors,
    ...creationErrors,
    ...emailResults.errors.map((e) => ({
      row: 0, // Email errors don't have row numbers
      error: `Email failed for ${e.email}: ${e.error}`,
    })),
  ];

  return {
    imported: createdUsers.length,
    emailsSent: emailResults.sent,
    emailsFailed: emailResults.failed,
    total: users.length,
    users: createdUsers,
    errors: allErrors.length > 0 ? allErrors : undefined,
    message: `Successfully imported ${createdUsers.length} user(s). Sent ${emailResults.sent}/${createdUsers.length} invitation emails.`,
  };
}

/**
 * PATCH /api/v1/users/[userId]/confirm
 * Confirm a pending user registration
 */
export async function confirmPendingUser(userId: string, user: UserContext) {
  if (user.role !== Role.ADMIN && user.role !== Role.DISTRICT_LEADER) {
    throw new ForbiddenError("Only admins and district leaders can confirm users");
  }

  const pendingUser = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!pendingUser) {
    throw new NotFoundError("User not found");
  }

  if (pendingUser.isVerified) {
    throw new ValidationError("User is already verified");
  }

  // District leaders can only confirm users in their district
  if (user.role === Role.DISTRICT_LEADER && pendingUser.districtId !== user.districtId) {
    throw new ForbiddenError("You can only confirm users in your district");
  }

  const confirmedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      isVerified: true,
      status: "active",
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      voicePart: true,
      districtId: true,
      createdAt: true,
    },
  });

  return {
    ...confirmedUser,
    createdAt: confirmedUser.createdAt.toISOString(),
  };
}

/**
 * DELETE /api/v1/users/[userId]/pending
 * Reject a pending user registration
 */
export async function rejectPendingUser(userId: string, user: UserContext) {
  if (user.role !== Role.ADMIN && user.role !== Role.DISTRICT_LEADER) {
    throw new ForbiddenError("Only admins and district leaders can reject users");
  }

  const pendingUser = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!pendingUser) {
    throw new NotFoundError("User not found");
  }

  if (pendingUser.isVerified) {
    throw new ValidationError("Cannot reject an already verified user");
  }

  // District leaders can only reject users in their district
  if (user.role === Role.DISTRICT_LEADER && pendingUser.districtId !== user.districtId) {
    throw new ForbiddenError("You can only reject users in your district");
  }

  await prisma.user.delete({
    where: { id: userId },
  });

  return { message: "User rejected successfully" };
}

