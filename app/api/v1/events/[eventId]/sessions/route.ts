/**
 * GET /api/v1/events/[eventId]/sessions
 * Get all sessions for a specific event
 * All authenticated users can access, scoped to their district if not admin
 */

import { prisma } from "@/lib/prisma";
import { successResponse } from "@/lib/api-errors";
import { getAppSession } from "@/lib/session";
import { getEffectiveUserId } from "@/lib/utils";
import { Role } from "@/prisma/generated/enums";
import { NextRequest } from "next/server";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ eventId: string }> }
) {
  try {
    const { user, iUser } = await getAppSession();
    const { eventId } = await context.params;

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

    // Fetch the event to verify it exists
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return Response.json(
        { success: false, error: "Event not found" },
        { status: 404 }
      );
    }

    // Check if user can access this event
    if (effectiveUser.role !== Role.ADMIN) {
      // Non-admin users can only access events in their district or multi-district events
      const canAccess =
        event.districtId === effectiveUser.districtId || event.districtId === null;
      if (!canAccess) {
        return Response.json(
          { success: false, error: "Forbidden" },
          { status: 403 }
        );
      }
    }

    const where: any = {
      eventId: eventId,
    };

    // Non-admin users only see sessions in their district
    if (effectiveUser.role !== Role.ADMIN) {
      where.districtId = effectiveUser.districtId;
    }

    const sessions = await prisma.session.findMany({
      where,
      include: {
        _count: { select: { attendances: true } },
      },
      orderBy: { startTime: "asc" },
    });

    const formattedSessions = sessions.map((session) => ({
      ...session,
      attendanceCount: session._count.attendances,
      _count: undefined,
    }));

    return Response.json(
      successResponse({
        data: formattedSessions,
        total: formattedSessions.length,
      })
    );
  } catch (error) {
    return Response.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch sessions",
      },
      { status: 500 }
    );
  }
}
