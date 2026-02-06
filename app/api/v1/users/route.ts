import { Role } from './../../../../prisma/generated/enums';
import { getAppSession } from "@/lib/session";
/**
 * GET /api/v1/users
 * List all users (with filters)
 *
 * POST /api/v1/users
 * Create a new user (admin only)
 * Sends auto-generated password via email
 */

import { prisma } from "@/lib/prisma";
import {
  successResponse,
  errorResponse,
  ValidationError,
  ForbiddenError,
  ConflictError,
} from "@/lib/api-errors";
import { hash } from "bcryptjs";
import { sendUserInvite } from "@/lib/email";
import { generateRandomPassword } from "@/lib/utils";
import { createUserSchema } from "@/lib/schema";

// GET /api/v1/users
export async function GET(req: Request) {
  try {
    const { user } = await getAppSession();
    const url = new URL(req.url);
    const districtId = url.searchParams.get("districtId");
    const role = url.searchParams.get("role");
    const voicePart = url.searchParams.get("voicePart");
    const search = url.searchParams.get("search"); // First name or last name search

    // Check if user can access this district
    if (districtId && user.role !== Role.ADMIN) {
     throw new ForbiddenError("Can only filter by your own district");
    }

    const where: any = {};

    // Apply filters based on user role
    if (user.role !== Role.ADMIN) {
      // Non-admin can only see their district
      where.districtId = user.districtId;
    } else if (districtId) {
      // Admin filtering by district
      where.districtId = districtId;
    }

    if (role) where.role = role;
    if (voicePart) where.voicePart = voicePart;

    // Search by first name or last name
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
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
        firstLogin: true,
        createdAt: true,
      },
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
    });

    return Response.json(successResponse({ data: users, total: users.length }));
  } catch (error) {
    const { response, statusCode } = errorResponse(
      error instanceof Error ? error.message : "Internal server error"
    );
    return Response.json(response, { status: statusCode });
  }
}

// POST /api/v1/users
export async function POST(req: Request) {
  try {
    const { user } = await getAppSession();
    const body = await req.json();

    // Validate request body using schema
    const validation = createUserSchema.safeParse(body);

    if (!validation.success) {
      const errors = validation.error.flatten().fieldErrors;
      throw new ValidationError(
        Object.values(errors)
          .flat()
          .join(", ") || "Invalid request data"
      );
    }

    const { email, firstName, lastName, voicePart, districtId, instrument, role } =
      validation.data;

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
    const randomPassword = generateRandomPassword();
    const hashedPassword = await hash(randomPassword, 10);

    // Create user
    const newUser = await prisma.user.create({
      data: {
        email,
        firstName,
        lastName,
        voicePart,
        instrument: instrument || null,
        role: role || Role.MEMBER,
        districtId,
        password: hashedPassword,
        firstLogin: true,
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
      await sendUserInvite(email, firstName, randomPassword);
    } catch (emailError) {
      console.error("Failed to send invitation email:", emailError);
      // Don't fail the request, user was created
    }

    return Response.json(
      successResponse({
        data: newUser,
        message: "User created successfully. Invitation email sent.",
      }),
      { status: 201 }
    );
  } catch (error) {
    if (
      error instanceof ValidationError ||
      error instanceof ForbiddenError ||
      error instanceof ConflictError
    ) {
      return Response.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      );
    }

    const { response, statusCode } = errorResponse(
      error instanceof Error ? error.message : "Internal server error"
    );
    return Response.json(response, { status: statusCode });
  }
}
