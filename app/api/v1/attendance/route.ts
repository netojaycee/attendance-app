/**
 * GET /api/v1/attendance
 * Get all attendance records for the current user
 *
 * POST /api/v1/attendance
 * Submit attendance for a session
 * Calculates percentage based on arrival time
 */

import { prisma } from "@/lib/prisma";
import { calculateAttendancePercentage, isSessionOpen } from "@/lib/attendance-calc";
import {
  successResponse,
  ValidationError,
  ForbiddenError,
} from "@/lib/api-errors";
import { getAppSession } from "@/lib/session";
import { getEffectiveUserId } from "@/lib/utils";
import { createAttendanceSchema } from "@/lib/schema";

export async function GET(_req: Request) {
  try {
    const { user, iUser } = await getAppSession();

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

    // Fetch all attendance records for the user
    const attendances = await prisma.attendance.findMany({
      where: { userId: effectiveUserId },
      include: {
        session: {
          select: {
            id: true,
            eventId: true,
            startTime: true,
            endTime: true,
            durationMinutes: true,
            districtId: true,
            event: { select: { title: true } },
          },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formattedAttendances = attendances.map((att) => ({
      id: att.id,
      userId: att.userId,
      sessionId: att.sessionId,
      arrivalTime: att.arrivalTime,
      percentageScore: att.percentageScore,
      session: {
        ...att.session,
        eventTitle: att.session.event.title,
        event: undefined,
      },
      createdAt: att.createdAt,
    }));

    return Response.json(
      successResponse({
        data: formattedAttendances,
        total: formattedAttendances.length,
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

export async function POST(req: Request) {
  try {
    const { user, iUser } = await getAppSession();
    const body = await req.json();

    // Validate request body with Zod schema
    const validation = createAttendanceSchema.safeParse(body);
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

    const { sessionId, arrivalTime } = validation.data;

    // Get the effective user ID (handles impersonation)
    const effectiveUserId = getEffectiveUserId(user, iUser);

    if (!effectiveUserId) {
      return Response.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Fetch the actual user (not effective) to check their real role
    const actualUser = await prisma.user.findUnique({
      where: { id: user?.id || "" },
      select: {
        id: true,
        role: true,
        districtId: true,
      },
    });

    if (!actualUser) {
      return Response.json(
        { success: false, error: "User not found" },
        { status: 401 }
      );
    }

    // Get session with event info
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { event: true },
    });

    if (!session) {
      return Response.json(
        { success: false, error: "Session not found" },
        { status: 404 }
      );
    }

    const now = new Date();
    const sessionStartTime = new Date(session.startTime);
    const eventStartDate = new Date(session.event.startDate);
    const eventEndDate = session.event.endDate
      ? new Date(session.event.endDate)
      : null;

    // Check submission window based on actual user role
    if (
      actualUser.role === "ADMIN" ||
      actualUser.role === "PART_LEADER" ||
      actualUser.role === "DISTRICT_LEADER"
    ) {
      // For admin, part leaders, and district leaders: check event date range
      // Event is ongoing if current time is between event start and end date
      if (now < eventStartDate) {
        throw new ForbiddenError("Event has not started yet");
      }
      if (eventEndDate && now > eventEndDate) {
        throw new ForbiddenError("Event has ended");
      }
    } else {
      // For regular members: enforce 3-day submission window
      if (!isSessionOpen(sessionStartTime)) {
        throw new ForbiddenError("Session is not open for submissions");
      }
    }

    // Check if user already submitted for this session
    const existingAttendance = await prisma.attendance.findUnique({
      where: {
        userId_sessionId: {
          userId: effectiveUserId,
          sessionId,
        },
      },
    });

    if (existingAttendance) {
      return Response.json(
        { success: false, error: "Already submitted attendance for this session" },
        { status: 409 }
      );
    }

    // Check if user is skipped for this event (no attendance needed)
    const eventSummary = await prisma.eventAttendanceSummary.findUnique({
      where: {
        eventId_userId: {
          eventId: session.eventId,
          userId: effectiveUserId,
        },
      },
      select: { skip: true },
    });

    if (eventSummary && eventSummary.skip) {
      return Response.json(
        {
          success: false,
          error: "User is skipped for this event and does not need to submit attendance",
        },
        { status: 409 }
      );
    }

    // Calculate percentage score
    const arrival = new Date(arrivalTime);
    const calculation = calculateAttendancePercentage(
      arrival,
      session.startTime,
      session.endTime
    );

    // Create attendance record
    const attendance = await prisma.attendance.create({
      data: {
        userId: effectiveUserId,
        sessionId,
        arrivalTime: arrival,
        percentageScore: calculation.percentageScore,
        createdById: effectiveUserId, // Self-submission
      },
      include: {
        session: {
          select: {
            event: { select: { title: true } },
          },
        },
      },
    });

    // Create or update EventAttendanceSummary record
    // Get all attendance records for this user in this event to calculate cumulative
    const allAttendances = await prisma.attendance.findMany({
      where: {
        userId: effectiveUserId,
        session: {
          eventId: session.eventId,
        },
      },
      select: {
        percentageScore: true,
      },
    });

    // Calculate cumulative percentage (average of all attendances)
    const totalPercentage =
      allAttendances.reduce((sum, att) => sum + att.percentageScore, 0) /
      allAttendances.length;

    // Create or update the summary
    await prisma.eventAttendanceSummary.upsert({
      where: {
        eventId_userId: {
          eventId: session.eventId,
          userId: effectiveUserId,
        },
      },
      create: {
        eventId: session.eventId,
        userId: effectiveUserId,
        cumulative: totalPercentage,
        skip: false,
      },
      update: {
        cumulative: totalPercentage,
      },
    });

    return Response.json(
      successResponse({
        data: {
          id: attendance.id,
          userId: attendance.userId,
          sessionId: attendance.sessionId,
          arrivalTime: attendance.arrivalTime,
          percentageScore: attendance.percentageScore,
          details: {
            minutesLate: calculation.minutesLate,
            maxPercentage: calculation.maxPercentage,
            isOnTime: calculation.isOnTime,
            deductionPercentage: calculation.deductionPercentage,
          },
        },
        message: `Attendance recorded at ${calculation.percentageScore}%`,
      }),
      { status: 201 }
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
          error instanceof Error ? error.message : "Failed to submit attendance",
      },
      { status: 500 }
    );
  }
}
