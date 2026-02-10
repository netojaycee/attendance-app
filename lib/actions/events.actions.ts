"use server";

/**
 * Events Server Actions
 * Client-facing actions for event management
 */

import { getAppSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import {
  getEvents,
  getEventByIdentifier,
  createEvent,
  updateEvent,
  deleteEvent,
  getEventAttendance,
  getEventSessions,
} from "@/lib/services/events.service";
import { EventType } from "@/prisma/generated/enums";

/**
 * Get all events (filtered by user's district if not admin)
 */
export async function getEventsAction(filters?: {
  type?: EventType;
  districtId?: string;
}) {
  try {
    const { user } = await getAppSession();

    if (!user?.id) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    const events = await getEvents(user, filters);

    return {
      success: true,
      data: events,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch events",
    };
  }
}

/**
 * Get event by ID
 */
export async function getEventByIdentifierAction(identifier: string) {
  try {
    const { user } = await getAppSession();

    if (!user?.id) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    const event = await getEventByIdentifier(identifier, user);

    return {
      success: true,
      data: event,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch event",
    };
  }
}

/**
 * Create new event
 */
export async function createEventAction(
  title: string,
  description: string | undefined,
  type: EventType,
  startDate: string,
  endDate: string | undefined,
  weeklyConstraint: boolean,
  minimumMinutesPerWeek?: number,
  districtId?: string,
  passMark?: number,
) {
  try {
    const { user } = await getAppSession();

    if (!user?.id) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    const result = await createEvent(
      {
        title,
        description,
        type,
        startDate,
        endDate,
        weeklyConstraint,
        minimumMinutesPerWeek,
        districtId,
        passMark,
      },
      user,
    );

    revalidatePath("/management");
    revalidatePath("/events");

    return {
      success: true,
      data: (result as any).event,
      message: (result as any).message,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create event",
    };
  }
}

/**
 * Update event
 */
export async function updateEventAction(
  eventId: string,
  data: {
    title?: string;
    description?: string;
    startDate?: string;
    endDate?: string;
    weeklyConstraint?: boolean;
    minimumMinutesPerWeek?: number;
    passMark?: number;
  },
) {
  try {
    const { user } = await getAppSession();

    if (!user?.id) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    const result = await updateEvent(eventId, data, user);

    revalidatePath("/management");
    revalidatePath("/events");

    return {
      success: true,
      data: (result as any).event,
      message: (result as any).message,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update event",
    };
  }
}

/**
 * Delete event
 */
export async function deleteEventAction(eventId: string) {
  try {
    const { user } = await getAppSession();

    if (!user?.id) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    const result = await deleteEvent(eventId, user);

    revalidatePath("/management");
    revalidatePath("/events");

    return {
      success: true,
      message: (result as any).message,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete event",
    };
  }
}

/**
 * Get event attendance summary
 */
export async function getEventAttendanceAction(eventId: string) {
  try {
    const { user } = await getAppSession();

    if (!user?.id) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    const attendance = await getEventAttendance(eventId, user.id);

    return {
      success: true,
      data: attendance,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch attendance",
    };
  }
}

/**
 * Get event sessions
 */
export async function getEventSessionsAction(eventId: string) {
  try {
    const { user } = await getAppSession();

    if (!user?.id) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    const sessions = await getEventSessions(eventId, user);

    return {
      success: true,
      data: sessions,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch sessions",
    };
  }
}

/**
 * Get current user's attendance progress for the current/active event
 */
export async function getUserCurrentEventProgressAction() {
  try {
    const { user } = await getAppSession();

    if (!user?.id) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    // Get the current/active event (one that has started and not ended)
    const now = new Date();
    const currentEvent = await prisma.event.findFirst({
      where: {
        startDate: {
          lte: now,
        },
        AND: [
          {
            OR: [
              {
                endDate: {
                  gte: now,
                },
              },
              {
                endDate: null,
              },
            ],
          },
          {
            OR: [
              {
                districtId: user.districtId,
              },
              {
                type: "MULTI_DISTRICT",
              },
            ],
          },
        ],
      },
      select: {
        id: true,
        title: true,
        passMark: true,
        sessions: {
          select: {
            id: true,
          },
        },
      },
      orderBy: {
        startDate: "desc",
      },
    });

    if (!currentEvent) {
      return {
        success: true,
        data: null,
        message: "No active events found",
      };
    }

    // Get event attendance summary for this user
    const summary = await prisma.eventAttendanceSummary.findUnique({
      where: {
        eventId_userId: {
          eventId: currentEvent.id,
          userId: user.id,
        },
      },
      select: {
        cumulative: true,
      },
    });

    // Get count of sessions attended by this user
    const sessionsAttended = await prisma.attendance.count({
      where: {
        userId: user.id,
        session: {
          eventId: currentEvent.id,
        },
      },
    });

    const currentPercentage = summary?.cumulative
      ? Math.round(summary.cumulative)
      : 0;
    const totalSessions = currentEvent.sessions.length;

    return {
      success: true,
      data: {
        eventId: currentEvent.id,
        eventTitle: currentEvent.title,
        targetPercentage: currentEvent.passMark,
        currentPercentage,
        sessionsAttended,
        totalSessions,
        noSessions: totalSessions === 0,
      },
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch progress data",
    };
  }
}

/**
 * Get all events for user with their progress/scores
 */
export async function getUserEventsWithProgressAction() {
  try {
    const { user } = await getAppSession();

    if (!user?.id) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    // Get all events for the user (direct query to include passMark)
    const allEvents = await prisma.event.findMany({
      where: {
        OR: [{ districtId: user.districtId }, { type: "MULTI_DISTRICT" }],
      },
      select: {
        id: true,
        title: true,
        description: true,
        type: true,
        startDate: true,
        endDate: true,
        passMark: true,
        slug: true,
      },
      orderBy: { startDate: "desc" },
    });

    if (!allEvents || allEvents.length === 0) {
      return {
        success: true,
        data: [],
      };
    }

    // Enrich events with user's progress
    const eventsWithProgress = await Promise.all(
      allEvents.map(async (event) => {
        // Get event attendance summary for this user
        const summary = await prisma.eventAttendanceSummary.findUnique({
          where: {
            eventId_userId: {
              eventId: event.id,
              userId: user.id,
            },
          },
          select: {
            cumulative: true,
          },
        });

        const userScore = summary?.cumulative
          ? Math.round(summary.cumulative)
          : 0;

        return {
          id: event.id,
          title: event.title,
          description: event.description,
          type: event.type,
          startDate: event.startDate,
          endDate: event.endDate,
          passMark: event.passMark,
          score: userScore,
          slug: event.slug,
          // isRequired: event.type === "SINGLE_DISTRICT",
        };
      }),
    );

    return {
      success: true,
      data: eventsWithProgress,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch events",
    };
  }
}

/**
 * Get all event participants based on user's role
 * PART_LEADER: users in their voice part
 * DISTRICT_LEADER: users in their district
 * ADMIN: users in district (if SINGLE_DISTRICT event) or all users (if MULTI_DISTRICT)
 */
export async function getEventParticipantsAction(
  eventId: string,
  filters?: {
    voicePart?: string;
    search?: string;
  },
) {
  try {
    const { user } = await getAppSession();

    if (!user?.id) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    // Get the event first
    const event = await prisma.event.findUnique({
      where: { slug: eventId },
      select: {
        id: true,
        type: true,
        districtId: true,
        passMark: true,
      },
    });

    if (!event) {
      return {
        success: false,
        error: "Event not found",
      };
    }

    // Build where clause based on user role
    const whereClause: any = {};

    if (user.role === "PART_LEADER") {
      // Part leader sees users in their voice part and district
      whereClause.voicePart = user.voicePart;
      whereClause.districtId = user.districtId;
    } else if (user.role === "DISTRICT_LEADER") {
      // District leader sees all users in their district
      whereClause.districtId = user.districtId;
    } else if (user.role === "ADMIN") {
      // Admin sees users based on event type
      if (event.type === "SINGLE_DISTRICT" && event.districtId) {
        whereClause.districtId = event.districtId;
      }
      // MULTI_DISTRICT admin sees all users
    }

    // Apply search filters
    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      whereClause.OR = [
        {
          firstName: {
            contains: searchLower,
            mode: "insensitive",
          },
        },
        {
          lastName: {
            contains: searchLower,
            mode: "insensitive",
          },
        },
        {
          instrument: {
            contains: searchLower,
            mode: "insensitive",
          },
        },
      ];
    }

    if (filters?.voicePart) {
      whereClause.voicePart = filters.voicePart;
    }

    // Get participants with their attendance summary for this event
    const participants = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        voicePart: true,
        instrument: true,
        districtId: true,
      },
      orderBy: [{ voicePart: "asc" }, { lastName: "asc" }],
    });

    // Enrich with attendance data
    const participantsWithAttendance = await Promise.all(
      participants.map(async (participant) => {
        const summary = await prisma.eventAttendanceSummary.findUnique({
          where: {
            eventId_userId: {
              eventId: event.id,
              userId: participant.id,
            },
          },
          select: {
            cumulative: true,
          },
        });

        const score = summary?.cumulative ? Math.round(summary.cumulative) : 0;
        const isMeetingTarget = score >= event.passMark;

        return {
          id: participant.id,
          firstName: participant.firstName,
          lastName: participant.lastName,
          email: participant.email,
          voicePart: participant.voicePart,
          instrument: participant.instrument,
          score,
          isMeetingTarget,
        };
      }),
    );

    return {
      success: true,
      data: participantsWithAttendance,
      eventId,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch participants",
    };
  }
}

/**
 * Get sessions for a specific user in an event (for viewing other users' data)
 */
export async function getEventSessionsForUserAction(
  eventId: string,
  userId: string,
) {
  try {
    const { user } = await getAppSession();

    if (!user?.id) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    // Verify user has permission to view this data
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { districtId: true, voicePart: true },
    });

    if (!targetUser) {
      return {
        success: false,
        error: "User not found",
      };
    }

    // Permission check
    if (user.role === "PART_LEADER") {
      if (
        targetUser.voicePart !== user.voicePart ||
        targetUser.districtId !== user.districtId
      ) {
        return {
          success: false,
          error: "Unauthorized",
        };
      }
    } else if (user.role === "DISTRICT_LEADER") {
      if (targetUser.districtId !== user.districtId) {
        return {
          success: false,
          error: "Unauthorized",
        };
      }
    } else if (user.role !== "ADMIN") {
      // Only members of their own data, leaders/admins can view others
      if (userId !== user.id) {
        return {
          success: false,
          error: "Unauthorized",
        };
      }
    }

    // Get all sessions for this event
    const sessions = await prisma.session.findMany({
      where: { eventId },
      select: {
        id: true,
        startTime: true,
        endTime: true,
        durationMinutes: true,
        date: true,
      },
      orderBy: { startTime: "asc" },
    });

    if (!sessions || sessions.length === 0) {
      return {
        success: true,
        data: [],
      };
    }

    // Enrich sessions with attendance data for this specific user
    const now = new Date();
    const sessionsWithAttendance = await Promise.all(
      sessions.map(async (session) => {
        const attendance = await prisma.attendance.findUnique({
          where: {
            userId_sessionId: {
              userId,
              sessionId: session.id,
            },
          },
          select: {
            percentageScore: true,
            arrivalTime: true,
          },
        });

        const isSessionPast = session.endTime < now;
        const isSessionCurrent =
          session.startTime <= now && session.endTime >= now;
        const isSessionFuture = session.startTime > now;

        return {
          id: session.id,
          startTime: session.startTime,
          endTime: session.endTime,
          durationMinutes: session.durationMinutes,
          date: session.date,
          isPast: isSessionPast,
          isCurrent: isSessionCurrent,
          isFuture: isSessionFuture,
          score: attendance?.percentageScore ?? null,
          hasAttendance: !!attendance,
          arrivalTime: attendance?.arrivalTime,
        };
      }),
    );

    return {
      success: true,
      data: sessionsWithAttendance,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch sessions",
    };
  }
}

/**
 * Get events with statistics for analytics page
 */
export async function getEventsWithStatsAction() {
  try {
    const { user } = await getAppSession();

    if (!user?.id) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    // Get all events for the user's district (or all if admin)
    const events = await prisma.event.findMany({
      where: user.role === "ADMIN" ? {} : { districtId: user.districtId },
      select: {
        id: true,
        title: true,
        startDate: true,
        endDate: true,
        sessions: {
          select: {
            id: true,
            startTime: true,
            endTime: true,
            _count: {
              select: {
                attendances: true,
              },
            },
          },
        },
        attendanceSummaries: {
          select: {
            cumulative: true,
          },
        },
      },
      orderBy: { startDate: "desc" },
    });

    // Enrich with calculated stats
    const eventsWithStats = events.map((event) => {
      const now = new Date();
      const isCompleted = event?.endDate ? event.endDate < now : false;
      const isActive = event?.startDate <= now && (event?.endDate ? event.endDate >= now : true);
      const _isUpcoming = event?.startDate > now;

      const status = isCompleted
        ? "completed"
        : isActive
          ? "active"
          : "upcoming";

      // Calculate total participants and average score
      const summaries = (event.attendanceSummaries as any[]) || [];
      const totalParticipants = summaries.length;
      const avgScore =
        totalParticipants > 0
          ? Math.round(
              (summaries.reduce((sum, s) => sum + (s.cumulative || 0), 0) /
                totalParticipants) *
                100,
            ) / 100
          : 0;

      return {
        id: event.id,
        title: event.title,
        date: event.startDate.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        status: status as "completed" | "active" | "upcoming",
        avgScore,
        participantCount: totalParticipants,
      };
    });

    return {
      success: true,
      data: eventsWithStats,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch events with stats",
    };
  }
}
