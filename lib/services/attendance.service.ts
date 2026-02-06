/**
 * Attendance Service
 * Handles attendance submission, retrieval, and updates
 * Uses attendance-calculation.service for percentage calculations
 */

import { prisma } from "@/lib/prisma";
import {
  ValidationError,
  ForbiddenError,
  NotFoundError,
} from "@/lib/api-errors";
import {
  calculateSessionAttendancePercentage,
  calculateCumulativeEventAttendance,
} from "@/lib/services/attendance-calculation.service";

export interface UserContext {
  id: string;
  email: string;
  role: string;
  districtId: string;
}

/**
 * Submit attendance for a session
 * Calculates session attendance % and updates cumulative event %
 *
 * @param userId - User submitting attendance
 * @param sessionId - Session ID
 * @param arrivalTime - User's arrival time
 * @throws NotFoundError if session or user not found
 * @throws ValidationError if arrival time is invalid or in future
 * @throws ForbiddenError if user not in session's district
 */
export async function submitAttendance(
  userId: string,
  sessionId: string,
  arrivalTime: string,
) {
  // Validate arrival time is not in future
  if (new Date(arrivalTime) > new Date()) {
    throw new ValidationError("Arrival time cannot be in the future");
  }

  // Get session with event details
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    select: {
      id: true,
      startTime: true,
      endTime: true,
      eventId: true,
      districtId: true,
      event: {
        select: {
          id: true,
          weeklyConstraint: true,
          minimumMinutesPerWeek: true,
        },
      },
    },
  });

  if (!session) {
    throw new NotFoundError("Session not found");
  }

  // Get user and verify they're in the same district
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      districtId: true,
    },
  });

  if (!user) {
    throw new NotFoundError("User not found");
  }

  // Check if user is in the session's district
  if (user.districtId !== session.districtId) {
    throw new ForbiddenError(
      "You are not authorized to submit attendance for this session",
    );
  }

  // Calculate session attendance percentage
  const sessionAttendancePercentage = calculateSessionAttendancePercentage(
    new Date(arrivalTime),
    new Date(session.startTime),
    new Date(session.endTime),
  );

  // Check if attendance already exists
  const existingAttendance = await prisma.attendance.findFirst({
    where: {
      userId,
      sessionId,
    },
  });

  let attendance;

  if (existingAttendance) {
    // Update existing attendance
    attendance = await prisma.attendance.update({
      where: { id: existingAttendance.id },
      data: {
        arrivalTime,
        percentageScore: sessionAttendancePercentage,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        userId: true,
        sessionId: true,
        arrivalTime: true,
        percentageScore: true,
      },
    });
  } else {
    // Create new attendance
    attendance = await prisma.attendance.create({
      data: {
        userId,
        sessionId,
        arrivalTime,
        percentageScore: sessionAttendancePercentage,
        createdById: userId,
      },
      select: {
        id: true,
        userId: true,
        sessionId: true,
        arrivalTime: true,
        percentageScore: true,
      },
    });
  }

  // Update cumulative event attendance for this user
  await updateEventAttendanceSummary(userId, session.event.id);

  return {
    attendance,
    message: "Attendance recorded successfully",
  };
}

/**
 * Update cumulative event attendance percentage for a user
 * Called after any attendance submission
 *
 * @param userId - User ID
 * @param eventId - Event ID
 */
async function updateEventAttendanceSummary(
  userId: string,
  eventId: string,
): Promise<void> {
  // Get all attendances for this user and event
  const attendances = await prisma.attendance.findMany({
    where: {
      userId,
      session: {
        eventId,
      },
    },
    select: {
      percentageScore: true,
      session: {
        select: {
          id: true,
          startTime: true,
          endTime: true,
        },
      },
    },
  });

  // Get event details
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: {
      id: true,
      weeklyConstraint: true,
      minimumMinutesPerWeek: true,
    },
  });

  if (!event) {
    throw new NotFoundError("Event not found");
  }

  // Prepare session data for calculation
  const userSessions = attendances.map((attendance) => {
    const durationMs =
      attendance.session.endTime.getTime() -
      attendance.session.startTime.getTime();
    const durationMinutes = durationMs / (1000 * 60);

    return {
      sessionDurationMinutes: durationMinutes,
      attendancePercentage: attendance.percentageScore,
    };
  });

  // Calculate cumulative percentage
  const cumulativePercentage = calculateCumulativeEventAttendance(
    userSessions,
    event.weeklyConstraint,
    event.minimumMinutesPerWeek,
  );

  // Get or create EventAttendanceSummary
  const existingSummary = await prisma.eventAttendanceSummary.findFirst({
    where: {
      userId,
      eventId,
    },
  });

  if (existingSummary) {
    // Update existing summary
    await prisma.eventAttendanceSummary.update({
      where: { id: existingSummary.id },
      data: {
        cumulative: cumulativePercentage,
        // sessionsAttended: attendances.length,
        // lastUpdatedAt: new Date(),
      },
    });
  } else {
    // Create new summary
    await prisma.eventAttendanceSummary.create({
      data: {
        userId,
        eventId,
        cumulative: cumulativePercentage,
        // sessionsAttended: attendances.length,
        // lastUpdatedAt: new Date(),
      },
    });
  }
}

/**
 * Get user's attendance record for a session
 *
 * @param userId - User ID
 * @param sessionId - Session ID
 * @throws NotFoundError if attendance not found
 */
export async function getAttendance(userId: string, sessionId: string) {
  const attendance = await prisma.attendance.findFirst({
    where: {
      userId,
      sessionId,
    },
    select: {
      id: true,
      userId: true,
      sessionId: true,
      arrivalTime: true,
      percentageScore: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!attendance) {
    throw new NotFoundError("Attendance record not found");
  }

  return attendance;
}

/**
 * Get all attendance records for a user in an event
 *
 * @param userId - User ID
 * @param eventId - Event ID
 */
export async function getEventAttendances(userId: string, eventId: string) {
  const attendances = await prisma.attendance.findMany({
    where: {
      userId,
      session: {
        eventId,
      },
    },
    select: {
      id: true,
      sessionId: true,
      arrivalTime: true,
      percentageScore: true,
      session: {
        select: {
          id: true,
          startTime: true,
          endTime: true,
        },
      },
      createdAt: true,
      updatedAt: true,
    },
    orderBy: {
      session: {
        startTime: "asc",
      },
    },
  });

  return attendances;
}

/**
 * Get cumulative attendance summary for user in event
 *
 * @param userId - User ID
 * @param eventId - Event ID
 * @throws NotFoundError if summary not found
 */
export async function getEventAttendanceSummary(
  userId: string,
  eventId: string,
) {
  const summary = await prisma.eventAttendanceSummary.findFirst({
    where: {
      userId,
      eventId,
    },
    select: {
      id: true,
      cumulative: true,
      // sessionsAttended: true,
      // lastUpdatedAt: true,
      event: {
        select: {
          id: true,
          title: true,
          weeklyConstraint: true,
          minimumMinutesPerWeek: true,
        },
      },
    },
  });

  if (!summary) {
    throw new NotFoundError("Attendance summary not found");
  }

  return summary;
}

/**
 * Get all events with attendance summary for a user
 *
 * @param userId - User ID
 */
export async function getUserEventAttendanceSummaries(userId: string) {
  const summaries = await prisma.eventAttendanceSummary.findMany({
    where: {
      userId,
    },
    select: {
      id: true,
      cumulative: true,
      // sessionsAttended: true,
      // lastUpdatedAt: true,
      event: {
        select: {
          id: true,
          title: true,
          type: true,
          weeklyConstraint: true,
          minimumMinutesPerWeek: true,
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  return summaries;
}

/**
 * Delete attendance record
 * Updates event attendance summary after deletion
 *
 * @param attendanceId - Attendance ID
 * @param userId - User ID (for authorization)
 */
export async function deleteAttendance(attendanceId: string, userId: string) {
  const attendance = await prisma.attendance.findUnique({
    where: { id: attendanceId },
    select: {
      id: true,
      userId: true,
      sessionId: true,
      session: {
        select: {
          eventId: true,
        },
      },
    },
  });

  if (!attendance) {
    throw new NotFoundError("Attendance record not found");
  }

  // Verify ownership
  if (attendance.userId !== userId) {
    throw new ForbiddenError("Not authorized to delete this attendance");
  }

  // Delete attendance
  await prisma.attendance.delete({
    where: { id: attendanceId },
  });

  // Update event attendance summary
  await updateEventAttendanceSummary(userId, attendance.session.eventId);

  return {
    message: "Attendance record deleted successfully",
  };
}
