/**
 * GET /api/v1/sessions/[sessionId]
 * Get a single session by ID
 *
 * PATCH /api/v1/sessions/[sessionId]
 * Update a session (admin/district leader only, creator only for district leaders)
 *
 * DELETE /api/v1/sessions/[sessionId]
 * Delete a session (admin only, creator only for district leaders)
 */

import { prisma } from "@/lib/prisma";
import {
  successResponse,
  ValidationError,
  ForbiddenError,
} from "@/lib/api-errors";
import { getAppSession } from "@/lib/session";
import { getEffectiveUserId } from "@/lib/utils";
import { updateSessionSchema } from "@/lib/schema";
import { Role } from "@/prisma/generated/enums";
import { NextRequest } from "next/server";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { user, iUser } = await getAppSession();
    const { sessionId } = await context.params;

    // Get the effective user ID (handles impersonation)
    const effectiveUserId = getEffectiveUserId(user, iUser);

    if (!effectiveUserId) {
      return Response.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Fetch the effective user from DB
    const effectiveUser = await prisma.user.findUnique({
      where: { id: effectiveUserId },
      select: {
        id: true,
        role: true,
        districtId: true,
      },
    });

    if (!effectiveUser) {
      return Response.json(
        { success: false, error: "User not found" },
        { status: 401 }
      );
    }

    // Fetch the session
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        event: { select: { title: true } },
        _count: { select: { attendances: true } },
      },
    });

    if (!session) {
      return Response.json(
        { success: false, error: "Session not found" },
        { status: 404 }
      );
    }

    // AUTHORIZATION: Check if user can view this session
    if (effectiveUser.role !== Role.ADMIN) {
      // Non-admin users can only view sessions in their district
      if (session.districtId !== effectiveUser.districtId) {
        return Response.json(
          { success: false, error: "Forbidden" },
          { status: 403 }
        );
      }
    }

    const formattedSession = {
      ...session,
      eventTitle: session.event.title,
      attendanceCount: session._count.attendances,
      event: undefined,
      _count: undefined,
    };

    return Response.json(successResponse({ data: formattedSession }));
  } catch (error) {
    return Response.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch session",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { user, iUser } = await getAppSession();
    const { sessionId } = await context.params;
    const body = await req.json();

    // Validate request body with Zod schema
    const validation = updateSessionSchema.safeParse(body);
    if (!validation.success) {
      return Response.json(
        {
          success: false,
          error: "Validation error",
          details: validation.error.issues,
        },
        { status: 400 }
      );
    }

    // Get the effective user ID (handles impersonation)
    const effectiveUserId = getEffectiveUserId(user, iUser);

    if (!effectiveUserId) {
      return Response.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Fetch the effective user from DB
    const effectiveUser = await prisma.user.findUnique({
      where: { id: effectiveUserId },
      select: {
        id: true,
        role: true,
        districtId: true,
      },
    });

    if (!effectiveUser) {
      return Response.json(
        { success: false, error: "User not found" },
        { status: 401 }
      );
    }

    // Fetch the session
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return Response.json(
        { success: false, error: "Session not found" },
        { status: 404 }
      );
    }

    // AUTHORIZATION RULES
    // Only ADMIN can edit any session
    // DISTRICT_LEADER can edit only sessions they created in their district
    if (effectiveUser.role === Role.ADMIN) {
      // Admin can edit any session
    } else if (effectiveUser.role === Role.DISTRICT_LEADER) {
      // District leader can only edit sessions they created in their district
      if (session.createdById !== effectiveUserId) {
        throw new ForbiddenError("You can only edit sessions you created");
      }
      if (session.districtId !== effectiveUser.districtId) {
        throw new ForbiddenError(
          "You can only edit sessions in your district"
        );
      }
    } else {
      throw new ForbiddenError("You don't have permission to edit sessions");
    }

    // Prepare update data from validated schema
    const updateData: any = {};
    const validatedData = validation.data;

    if (validatedData.startTime !== undefined) {
      updateData.startTime = new Date(validatedData.startTime);
    }

    if (validatedData.endTime !== undefined) {
      updateData.endTime = new Date(validatedData.endTime);
    }

    if (validatedData.durationMinutes !== undefined) {
      updateData.durationMinutes = validatedData.durationMinutes;
    }

    if (validatedData.date !== undefined) {
      updateData.date = new Date(validatedData.date);
    }

    // Update the session
    const updatedSession = await prisma.session.update({
      where: { id: sessionId },
      data: updateData,
      include: {
        event: { select: { title: true } },
        _count: { select: { attendances: true } },
      },
    });

    const formattedSession = {
      ...updatedSession,
      eventTitle: updatedSession.event.title,
      attendanceCount: updatedSession._count.attendances,
      event: undefined,
      _count: undefined,
    };

    return Response.json(successResponse({ data: formattedSession }));
  } catch (error) {
    if (error instanceof ValidationError || error instanceof ForbiddenError) {
      return Response.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      );
    }

    return Response.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to update session",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { user, iUser } = await getAppSession();
    const { sessionId } = await context.params;

    // Get the effective user ID (handles impersonation)
    const effectiveUserId = getEffectiveUserId(user, iUser);

    if (!effectiveUserId) {
      return Response.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Fetch the effective user from DB
    const effectiveUser = await prisma.user.findUnique({
      where: { id: effectiveUserId },
      select: {
        id: true,
        role: true,
        districtId: true,
      },
    });

    if (!effectiveUser) {
      return Response.json(
        { success: false, error: "User not found" },
        { status: 401 }
      );
    }

    // Fetch the session
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return Response.json(
        { success: false, error: "Session not found" },
        { status: 404 }
      );
    }

    // AUTHORIZATION RULES
    // Only ADMIN can delete any session
    // DISTRICT_LEADER can delete only sessions they created in their district
    if (effectiveUser.role === Role.ADMIN) {
      // Admin can delete any session
    } else if (effectiveUser.role === Role.DISTRICT_LEADER) {
      // District leader can only delete sessions they created in their district
      if (session.createdById !== effectiveUserId) {
        throw new ForbiddenError("You can only delete sessions you created");
      }
      if (session.districtId !== effectiveUser.districtId) {
        throw new ForbiddenError(
          "You can only delete sessions in your district"
        );
      }
    } else {
      throw new ForbiddenError("You don't have permission to delete sessions");
    }

    // Delete the session
    await prisma.session.delete({
      where: { id: sessionId },
    });

    return Response.json(
      successResponse({ data: { message: "Session deleted successfully" } })
    );
  } catch (error) {
    if (error instanceof ValidationError || error instanceof ForbiddenError) {
      return Response.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      );
    }

    return Response.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to delete session",
      },
      { status: 500 }
    );
  }
}
