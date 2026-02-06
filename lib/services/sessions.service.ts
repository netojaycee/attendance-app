/**
 * Sessions Service
 * Contains all business logic for session operations
 */

import { prisma } from "@/lib/prisma";
import {
  ValidationError,
  ForbiddenError,
  NotFoundError,
} from "@/lib/api-errors";
import { Role, EventType } from "@/prisma/generated/enums";

// Types for service methods
export interface CreateSessionInput {
  eventId: string;
  date?: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  districtId: string;
}

export interface UpdateSessionInput {
  startTime?: string;
  endTime?: string;
  durationMinutes?: number;
  date?: string;
}

export interface UserContext {
  id: string;
  role: Role;
  districtId: string | null;
}

/**
 * GET /api/v1/sessions
 * List sessions with filters and authorization
 */
export async function getSessions(
  user: UserContext,
  filters?: {
    eventId?: string;
    districtId?: string;
  }
) {
  const where: any = {};

  if (filters?.eventId) {
    where.eventId = filters.eventId;
  }

  if (filters?.districtId && user.role === Role.ADMIN) {
    where.districtId = filters.districtId;
  }

  // Non-admin users only see sessions in their district
  if (user.role !== Role.ADMIN) {
    where.districtId = user.districtId;
  }

  const sessions = await prisma.session.findMany({
    where,
    include: {
      event: { select: { title: true } },
      _count: { select: { attendances: true } },
    },
    orderBy: { startTime: "asc" },
  });

  return sessions.map((session) => ({
    ...session,
    attendanceCount: session._count.attendances,
    _count: undefined,
  }));
}

/**
 * GET /api/v1/sessions/[sessionId]
 * Get a single session by ID with authorization
 */
export async function getSessionById(sessionId: string, user: UserContext) {
  // Fetch the session
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: {
      event: { select: { title: true } },
      _count: { select: { attendances: true } },
    },
  });

  if (!session) {
    throw new NotFoundError("Session not found");
  }

  // AUTHORIZATION: Check if user can view this session
  if (user.role !== Role.ADMIN) {
    // Non-admin users can only view sessions in their district
    if (session.districtId !== user.districtId) {
      throw new ForbiddenError("You don't have access to this session");
    }
  }

  return {
    ...session,
    eventTitle: session.event.title,
    attendanceCount: session._count.attendances,
    event: undefined,
    _count: undefined,
  };
}

/**
 * POST /api/v1/sessions
 * Create a new session with authorization and weekly constraint validation
 */
export async function createSession(
  input: CreateSessionInput,
  user: UserContext
) {
  const { eventId, date, startTime, endTime, durationMinutes, districtId } =
    input;

  // AUTHORIZATION RULES
  // Only ADMIN and DISTRICT_LEADER can create sessions
  if (
    user.role !== Role.ADMIN &&
    user.role !== Role.DISTRICT_LEADER
  ) {
    throw new ForbiddenError("You don't have permission to create sessions");
  }

  // DISTRICT_LEADER can only create sessions for their district
  if (
    user.role === Role.DISTRICT_LEADER &&
    user.districtId !== districtId
  ) {
    throw new ForbiddenError(
      "You can only create sessions in your district"
    );
  }

  // Verify event exists
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: {
      id: true,
      districtId: true,
      type: true,
      weeklyConstraint: true,
      minimumMinutesPerWeek: true,
    },
  });

  if (!event) {
    throw new ValidationError("Event not found");
  }

  // For SINGLE_DISTRICT events, verify the session district matches the event district
  if (event.type === EventType.SINGLE_DISTRICT && event.districtId && event.districtId !== districtId) {
    throw new ForbiddenError(
      "Session district does not match event district"
    );
  }

  // If event has weekly constraint enabled, validate total duration
  if (event.weeklyConstraint) {
    // Get all existing sessions for this event
    const existingSessions = await prisma.session.findMany({
      where: { eventId },
      select: { durationMinutes: true },
    });

    // Calculate total duration including the new session
    const totalDuration = existingSessions.reduce(
      (sum, session) => sum + session.durationMinutes,
      0
    ) + durationMinutes;

    // Check if total exceeds the constraint
    if (totalDuration > event.minimumMinutesPerWeek) {
      throw new ValidationError(
        `Total session duration (${totalDuration} minutes) exceeds weekly constraint of ${event.minimumMinutesPerWeek} minutes`
      );
    }
  }

  const session = await prisma.session.create({
    data: {
      eventId,
      date: new Date(date || startTime),
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      durationMinutes,
      districtId,
      createdById: user.id,
    },
    include: {
      event: { select: { title: true } },
    },
  });

  return {
    ...session,
    eventTitle: session.event.title,
    event: undefined,
  };
}

/**
 * PATCH /api/v1/sessions/[sessionId]
 * Update a session with authorization and weekly constraint validation
 */
export async function updateSession(
  sessionId: string,
  input: UpdateSessionInput,
  user: UserContext
) {
  // Fetch the session
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    select: {
      id: true,
      eventId: true,
      districtId: true,
      createdById: true,
      durationMinutes: true,
    },
  });

  if (!session) {
    throw new NotFoundError("Session not found");
  }

  // AUTHORIZATION RULES
  // Only ADMIN can edit any session
  // DISTRICT_LEADER can edit any sessions in their district
  if (user.role === Role.ADMIN) {
    // Admin can edit any session
  } else if (user.role === Role.DISTRICT_LEADER) {
    // District leader can edit any sessions in their district
    if (session.districtId !== user.districtId) {
      throw new ForbiddenError(
        "You can only edit sessions in your district"
      );
    }
  } else {
    throw new ForbiddenError("You don't have permission to edit sessions");
  }

  // If updating duration, validate weekly constraint
  if (input.durationMinutes !== undefined) {
    const event = await prisma.event.findUnique({
      where: { id: session.eventId },
      select: {
        weeklyConstraint: true,
        minimumMinutesPerWeek: true,
      },
    });

    if (event && event.weeklyConstraint) {
      // Get all existing sessions for this event (excluding current session)
      const otherSessions = await prisma.session.findMany({
        where: {
          eventId: session.eventId,
          id: { not: sessionId },
        },
        select: { durationMinutes: true },
      });

      // Calculate total duration with updated duration
      const totalDuration = otherSessions.reduce(
        (sum, s) => sum + s.durationMinutes,
        0
      ) + input.durationMinutes;

      // Check if total exceeds the constraint
      if (totalDuration > event.minimumMinutesPerWeek) {
        throw new ValidationError(
          `Total session duration (${totalDuration} minutes) exceeds weekly constraint of ${event.minimumMinutesPerWeek} minutes`
        );
      }
    }
  }

  // Prepare update data
  const updateData: any = {};

  if (input.startTime !== undefined) {
    updateData.startTime = new Date(input.startTime);
  }

  if (input.endTime !== undefined) {
    updateData.endTime = new Date(input.endTime);
  }

  if (input.durationMinutes !== undefined) {
    updateData.durationMinutes = input.durationMinutes;
  }

  if (input.date !== undefined) {
    updateData.date = new Date(input.date);
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

  return {
    ...updatedSession,
    eventTitle: updatedSession.event.title,
    attendanceCount: updatedSession._count.attendances,
    event: undefined,
    _count: undefined,
  };
}

/**
 * DELETE /api/v1/sessions/[sessionId]
 * Delete a session with authorization
 */
export async function deleteSession(sessionId: string, user: UserContext) {
  // Fetch the session
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    select: {
      id: true,
      districtId: true,
      createdById: true,
      _count: { select: { attendances: true } },
    },
  });

  if (!session) {
    throw new NotFoundError("Session not found");
  }

  // Check if session has attendance data
  if (session._count.attendances > 0) {
    throw new ValidationError(
      "Cannot delete session with existing attendance records"
    );
  }

  // AUTHORIZATION RULES
  // Only ADMIN can delete any session
  // DISTRICT_LEADER can delete any sessions in their district
  if (user.role === Role.ADMIN) {
    // Admin can delete any session
  } else if (user.role === Role.DISTRICT_LEADER) {
    // District leader can delete any sessions in their district
    if (session.districtId !== user.districtId) {
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

  return { message: "Session deleted successfully" };
}
