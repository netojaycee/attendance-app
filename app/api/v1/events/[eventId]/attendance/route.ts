/**
 * GET /api/v1/events/[eventId]/attendance
 * Get all attendance records for the effective user in this event
 * Returns user's attendance alongside session details
 */

import { prisma } from "@/lib/prisma";
import { successResponse } from "@/lib/api-errors";
import { getAppSession } from "@/lib/session";
import { getEffectiveUserId } from "@/lib/utils";
import { NextRequest } from "next/server";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await context.params;
    const { user, iUser } = await getAppSession();

    const effectiveUserId = getEffectiveUserId(user, iUser);

    if (!effectiveUserId) {
      return Response.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Fetch the event to verify it exists
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        title: true,
        type: true,
        districtId: true,
      },
    });

    if (!event) {
      return Response.json(
        { success: false, error: "Event not found" },
        { status: 404 }
      );
    }

    // Get all sessions for this event
    const sessions = await prisma.session.findMany({
      where: { eventId },
      select: { id: true },
    });

    const sessionIds = sessions.map((s) => s.id);

    // If no sessions, return empty array
    if (sessionIds.length === 0) {
      return Response.json(
        successResponse({
          data: [],
          total: 0,
          event,
        })
      );
    }

    // Fetch all attendance records for the effective user in sessions of this event
    const attendances = await prisma.attendance.findMany({
      where: {
        userId: effectiveUserId,
        sessionId: { in: sessionIds },
      },
      include: {
        session: {
          select: {
            id: true,
            eventId: true,
            startTime: true,
            endTime: true,
            durationMinutes: true,
            districtId: true,
          },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            voicePart: true,
            districtId: true,
          },
        },
      },
      orderBy: {
        session: { startTime: "asc" },
      },
    });

    const formattedAttendances = attendances.map((att) => ({
      id: att.id,
      userId: att.userId,
      sessionId: att.sessionId,
      arrivalTime: att.arrivalTime,
      percentageScore: att.percentageScore,
      session: att.session,
      user: att.user,
      createdAt: att.createdAt,
    }));

    return Response.json(
      successResponse({
        data: formattedAttendances,
        total: formattedAttendances.length,
        event,
      })
    );
  } catch (error) {
    return Response.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch attendance",
      },
      { status: 500 }
    );
  }
}
