/**
 * DELETE /api/v1/users/[userId]
 * Delete a user
 * Authorization: ADMIN only or DISTRICT_LEADER for users in their district
 */

import { prisma } from "@/lib/prisma";
import {
  successResponse,
  errorResponse,
  ForbiddenError,
  NotFoundError,
} from "@/lib/api-errors";
import { Role } from "@/prisma/generated/enums";
import { getAppSession } from "@/lib/session";
import { NextRequest } from "next/server";

export async function DELETE(
    _req: NextRequest,
    context: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await context.params;
    const { user } = await getAppSession();
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

    return Response.json(
      successResponse({
        message: `User ${targetUser.firstName} ${targetUser.lastName} deleted successfully`,
      })
    );
  } catch (error) {
    if (error instanceof ForbiddenError || error instanceof NotFoundError) {
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
