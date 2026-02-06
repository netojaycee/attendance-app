/**
 * Events Service
 * Contains all business logic for event operations
 */

import { prisma } from "@/lib/prisma";
import {
  ValidationError,
  ForbiddenError,
  NotFoundError,
} from "@/lib/api-errors";
import { EventType, Role } from "@/prisma/generated/enums";
import { generateSlug } from "../utils";

// Types for service methods
export interface CreateEventInput {
  title: string;
  description?: string;
  type: EventType;
  startDate: string;
  endDate?: string;
  districtId?: string;
  passMark?: number; // Defaults to 75
  weeklyConstraint?: boolean; // Defaults to false
  minimumMinutesPerWeek?: number; // Only required if weeklyConstraint is true
}

export interface UpdateEventInput {
  title?: string;
  description?: string;
  type?: EventType;
  startDate?: string;
  slug?: string;
  endDate?: string;
  districtId?: string;
  passMark?: number;
  weeklyConstraint?: boolean;
  minimumMinutesPerWeek?: number;
}

export interface UserContext {
  id: string;
  role: Role;
  districtId: string | null;
}

export interface SkipUserInput {
  userId: string;
}

/**
 * GET /api/v1/events
 * List events with filters and authorization
 */
export async function getEvents(
  user: UserContext,
  filters?: {
    type?: EventType;
    districtId?: string;
  },
) {
  const where: any = {};

  // For non-admin users, only show events in their district or multi-district events
  if (user.role !== Role.ADMIN) {
    where.OR = [
      { districtId: user.districtId }, // Single-district events in their district
      { districtId: null }, // All multi-district events
    ];
  } else if (filters?.districtId) {
    // Admin filtering by district
    where.districtId = filters.districtId;
  }

  if (filters?.type) {
    where.type = filters.type;
  }
  // if (filters?.slug) {
  //   where.slug = filters.slug;
  // }

  const events = await prisma.event.findMany({
    where,
    include: {
      district: {
        select: { name: true },
      },
      _count: {
        select: { sessions: true },
      },
    },
    orderBy: { startDate: "desc" },
  });
  return events.map((event) => ({
    ...event,
    startDate: event.startDate.toISOString(),
    endDate: event.endDate ? event.endDate.toISOString() : null,
    createdAt: event.createdAt.toISOString(),
    updatedAt: event.updatedAt.toISOString(),
    sessionCount: event._count.sessions,
    _count: undefined,
  }));
}

/**
 * GET /api/v1/events/[eventId]
 * Get a single event by ID with authorization
 */
export async function getEventByIdentifier(identifier: string, user: UserContext) {
  // Fetch the event
  const event = await prisma.event.findFirst({
    where: {
      OR: [
        { id: identifier },
        { slug: identifier },
      ],
    },
    include: {
      _count: {
        select: { sessions: true },
      },
    },
  });

  if (!event) {
    throw new NotFoundError("Event not found");
  }

  // Authorization: Check if user can view this event
  if (user.role !== Role.ADMIN) {
    // Non-admin users can only view events in their district or multi-district events
    const canView =
      event.districtId === user.districtId || event.districtId === null;
    if (!canView) {
      throw new ForbiddenError("You don't have access to this event");
    }
  }

  return {
    ...event,
    startDate: event.startDate.toISOString(),
    endDate: event.endDate ? event.endDate.toISOString() : null,
    createdAt: event.createdAt.toISOString(),
    updatedAt: event.updatedAt.toISOString(),
    sessionCount: event._count.sessions,
    _count: undefined,
  };
}

/**
 * POST /api/v1/events
 * Create a new event with authorization
 */
export async function createEvent(input: CreateEventInput, user: UserContext) {
  const {
    title,
    description,
    type,
    startDate,
    endDate,
    districtId,
    weeklyConstraint = false,
    minimumMinutesPerWeek,
    passMark = 75,
  } = input;

  const slug = generateSlug(title);
  // AUTHORIZATION RULES
  // Only ADMIN can create MULTI_DISTRICT events
  if (type === EventType.MULTI_DISTRICT && user.role !== Role.ADMIN) {
    throw new ForbiddenError("Only admins can create multi-district events");
  }

  // For SINGLE_DISTRICT events, districtId is required
  if (type === EventType.SINGLE_DISTRICT && !districtId) {
    throw new ValidationError("District required for single-district events");
  }

  // DISTRICT_LEADER can only create events in their own district
  if (user.role === Role.DISTRICT_LEADER) {
    if (!districtId || districtId !== user.districtId) {
      throw new ForbiddenError(
        "You can only create events in your own district",
      );
    }
  }

  const event = await prisma.event.create({
    data: {
      title,
      slug,
      description: description || null,
      type,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
      districtId: districtId || null,
      creatorId: user.id,
      weeklyConstraint,
      minimumMinutesPerWeek: weeklyConstraint
        ? minimumMinutesPerWeek || 240
        : 240,
      passMark,
    },
  });

  return {
    ...event,
    startDate: event.startDate.toISOString(),
    endDate: event.endDate ? event.endDate.toISOString() : null,
    createdAt: event.createdAt.toISOString(),
    updatedAt: event.updatedAt.toISOString(),
  };
}

/**
 * PATCH /api/v1/events/[eventId]
 * Update an event with authorization
 */
export async function updateEvent(
  identifier: string,
  input: UpdateEventInput,
  user: UserContext,
) {
  // Fetch the event
  const event = await prisma.event.findFirst({
    where: {
      OR: [
        { id: identifier },
        { slug: identifier },
      ],
    },
  });

  if (!event) {
    throw new NotFoundError("Event not found");
  }

  // AUTHORIZATION RULES
  // Only ADMIN can edit any event
  // DISTRICT_LEADER can edit any events in their district (allows multiple DLs to collaborate)
  if (user.role === Role.ADMIN) {
    // Admin can edit any event
  } else if (user.role === Role.DISTRICT_LEADER) {
    // District leader can edit any events in their district
    if (event.districtId !== user.districtId) {
      throw new ForbiddenError("You can only edit events in your district");
    }
  } else {
    throw new ForbiddenError("You don't have permission to edit events");
  }

  // Validate and prepare update data
  const updateData: any = {};

  if (input.title !== undefined) {
    updateData.title = input.title;
    // If title changes, also update slug
    updateData.slug = generateSlug(input.title);
  }

  if (input.description !== undefined) {
    updateData.description = input.description;
  }

  if (input.type !== undefined) {
    // Only ADMIN can change event type
    if (user.role !== Role.ADMIN && input.type !== event.type) {
      throw new ForbiddenError("Only admins can change event type");
    }
    updateData.type = input.type;
  }

  if (input.startDate !== undefined) {
    updateData.startDate = new Date(input.startDate);
  }

  if (input.endDate !== undefined) {
    updateData.endDate = input.endDate ? new Date(input.endDate) : null;
  }

  if (input.districtId !== undefined) {
    // Only ADMIN can change districtId
    if (user.role !== Role.ADMIN && input.districtId !== event.districtId) {
      throw new ForbiddenError("Only admins can change the district");
    }
    updateData.districtId = input.districtId;
  }

  if (input.weeklyConstraint !== undefined) {
    updateData.weeklyConstraint = input.weeklyConstraint;
  }

  if (input.minimumMinutesPerWeek !== undefined) {
    updateData.minimumMinutesPerWeek = input.minimumMinutesPerWeek;
  }

  if (input.passMark !== undefined) {
    updateData.passMark = input.passMark;
  }

  // Update the event
  const updatedEvent = await prisma.event.update({
    where: { id: event.id },
    data: updateData,
    include: {
      _count: {
        select: { sessions: true },
      },
    },
  });

  return {
    ...updatedEvent,
    startDate: updatedEvent.startDate.toISOString(),
    endDate: updatedEvent.endDate ? updatedEvent.endDate.toISOString() : null,
    createdAt: updatedEvent.createdAt.toISOString(),
    updatedAt: updatedEvent.updatedAt.toISOString(),
    sessionCount: updatedEvent._count.sessions,
    _count: undefined,
  };
}

/**
 * DELETE /api/v1/events/[eventId]
 * Delete an event with authorization
 */
export async function deleteEvent(eventId: string, user: UserContext) {
  // Fetch the event with session count
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      sessions: {
        select: {
          id: true,
          _count: { select: { attendances: true } },
        },
      },
    },
  });

  if (!event) {
    throw new NotFoundError("Event not found");
  }

  // Check if event has sessions with attendance data
  const sessionsWithAttendance = event.sessions.filter(
    (session) => session._count.attendances > 0
  );

  if (sessionsWithAttendance.length > 0) {
    throw new ValidationError(
      "Cannot delete event with existing attendance records"
    );
  }

  // AUTHORIZATION RULES
  // Only ADMIN can delete events
  // DISTRICT_LEADER can delete any events in their district (allows multiple DLs to collaborate)
  if (user.role === Role.ADMIN) {
    // Admin can delete any event
  } else if (user.role === Role.DISTRICT_LEADER) {
    // District leader can delete any events in their district
    if (event.districtId !== user.districtId) {
      throw new ForbiddenError("You can only delete events in your district");
    }
  } else {
    throw new ForbiddenError("You don't have permission to delete events");
  }

  // Delete the event
  await prisma.event.delete({
    where: { id: eventId },
  });

  return { message: "Event deleted successfully" };
}

/**
 * GET /api/v1/events/[eventId]/attendance
 * Get all attendance records for a user in an event
 */
export async function getEventAttendance(eventId: string, userId: string) {
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
    throw new NotFoundError("Event not found");
  }

  // Get all sessions for this event
  const sessions = await prisma.session.findMany({
    where: { eventId },
    select: { id: true },
  });

  const sessionIds = sessions.map((s) => s.id);

  // If no sessions, return empty array
  if (sessionIds.length === 0) {
    return {
      attendances: [],
      total: 0,
      event,
    };
  }

  // Fetch all attendance records for the user in sessions of this event
  const attendances = await prisma.attendance.findMany({
    where: {
      userId,
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

  return {
    attendances: formattedAttendances,
    total: formattedAttendances.length,
    event,
  };
}

/**
 * GET /api/v1/events/[eventId]/sessions
 * Get all sessions for an event with authorization
 */
export async function getEventSessions(eventId: string, user: UserContext) {
  // Fetch the event to verify it exists
  const event = await prisma.event.findUnique({
    where: { id: eventId },
  });

  if (!event) {
    throw new NotFoundError("Event not found");
  }

  // Check if user can access this event
  if (user.role !== Role.ADMIN) {
    // Non-admin users can only access events in their district or multi-district events
    const canAccess =
      event.districtId === user.districtId || event.districtId === null;
    if (!canAccess) {
      throw new ForbiddenError("You don't have access to this event");
    }
  }

  const where: any = {
    eventId: eventId,
  };

  // Non-admin users only see sessions in their district
  if (user.role !== Role.ADMIN) {
    where.districtId = user.districtId;
  }

  const sessions = await prisma.session.findMany({
    where,
    include: {
      _count: { select: { attendances: true } },
    },
    orderBy: { startTime: "asc" },
  });

  return sessions.map((session) => ({
    ...session,
    startTime: session.startTime.toISOString(),
    endTime: session.endTime.toISOString(),
    createdAt: session.createdAt.toISOString(),
    updatedAt: session.updatedAt.toISOString(),
    attendanceCount: session._count.attendances,
    eventSlug: event.slug,
    _count: undefined,
  }));
}

/**
 * POST /api/v1/events/[eventId]/skip
 * Grant user direct entry to event without attendance (Admin only)
 */
export async function skipUserForEvent(
  eventId: string,
  input: SkipUserInput,
  user: UserContext,
) {
  // Authorization: ADMIN only
  if (user.role !== Role.ADMIN) {
    throw new ForbiddenError("Only administrators can skip users");
  }

  const { userId } = input;

  // Validate userId is provided
  if (!userId) {
    throw new ValidationError("User ID is required");
  }

  // Check if event exists
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { id: true },
  });

  if (!event) {
    throw new NotFoundError("Event not found");
  }

  // Check if user exists
  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });

  if (!targetUser) {
    throw new NotFoundError("User not found");
  }

  // Check if user is already skipped
  const existingSummary = await prisma.eventAttendanceSummary.findUnique({
    where: {
      eventId_userId: {
        eventId,
        userId,
      },
    },
    select: { skip: true },
  });

  if (existingSummary && existingSummary.skip) {
    throw new ValidationError("User is already skipped for this event");
  }

  // Create or update the summary record with skip=true and cumulative=100
  const summary = await prisma.eventAttendanceSummary.upsert({
    where: {
      eventId_userId: {
        eventId,
        userId,
      },
    },
    create: {
      eventId,
      userId,
      cumulative: 100,
      skip: true,
    },
    update: {
      cumulative: 100,
      skip: true,
    },
    select: {
      id: true,
      eventId: true,
      userId: true,
      cumulative: true,
      skip: true,
    },
  });

  return {
    data: summary,
    message: "User skipped successfully with direct entry granted",
  };
}
