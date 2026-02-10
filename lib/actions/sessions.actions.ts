"use server";

/**
 * Sessions Server Actions
 * Client-facing actions for session management
 */

import { getAppSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import {
  getSessions,
  getSessionById,
  createSession,
  updateSession,
  deleteSession,
} from "@/lib/services/sessions.service";

/**
 * Get all sessions (filtered by user's district if not admin)
 */
export async function getSessionsAction(filters?: {
  eventId?: string;
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

    const sessions = await getSessions(user, filters);

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
 * Get session by ID
 */
export async function getSessionByIdAction(sessionId: string) {
  try {
    const { user } = await getAppSession();

    if (!user?.id) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    const session = await getSessionById(sessionId, user);

    return {
      success: true,
      data: session,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch session",
    };
  }
}

/**
 * Create new session
 */
export async function createSessionAction(input: {
  eventId: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  districtId: string;
  status?: string;
}) {
  try {
    const { user } = await getAppSession();

    if (!user?.id) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    const result = await createSession(
      {
        eventId: input.eventId,
        durationMinutes: input.durationMinutes,
        startTime: input.startTime,
        endTime: input.endTime,
        districtId: input.districtId,
      },
      user,
    );

    revalidatePath("/management/events", "page");

    return {
      success: true,
      data: (result as any).session,
      message: (result as any).message,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to create session",
    };
  }
}

/**
 * Update session
 */
export async function updateSessionAction(
  sessionId: string,
  data: {
    startTime?: string;
    endTime?: string;
    durationMinutes?: number;
    status?: string;
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

      console.log("Updating session with input:", { sessionId, ...data, user });


    const result = await updateSession(sessionId, data, user);

    revalidatePath("/management/events", "layout");

    return {
      success: true,
      data: (result as any).session,
      message: (result as any).message,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update session",
    };
  }
}

/**
 * Get next upcoming session for the current user
 */
export async function getNextSessionAction() {
  try {
    const { user } = await getAppSession();

    if (!user?.id) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    const now = new Date();

    const session = await prisma.session.findFirst({
      where: {
        endTime: {
          gte: now, // Session hasn't ended yet
        },
        districtId: user.role === "ADMIN" ? undefined : user.districtId,
      },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            type: true,
          },
        },
      },
      orderBy: {
        startTime: "asc",
      },
    });

    return {
      success: true,
      data: session,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch next session",
    };
  }
}

/**
 * Delete session
 */
export async function deleteSessionAction(sessionId: string) {
  try {
    const { user } = await getAppSession();

    if (!user?.id) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    const result = await deleteSession(sessionId, user);

    revalidatePath("/management/events", "layout");

    return {
      success: true,
      message: (result as any).message,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to delete session",
    };
  }
}

/**
 * Get all sessions for an event with user's attendance data
 */
export async function getEventSessionsWithAttendanceAction(identifier: string) {
  try {
    const { user } = await getAppSession();

    if (!user?.id) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    // Get all sessions for this event
    const sessions = await prisma.session.findMany({
      where: {
        event: {
          OR: [{ id: identifier }, { slug: identifier }],
        },
        // Only show sessions in user's district if not admin
        ...(user.role !== "ADMIN" && { districtId: user.districtId }),
      },
      select: {
        id: true,
        startTime: true,
        endTime: true,
        durationMinutes: true,
        date: true,
      },
      orderBy: {
        startTime: "asc",
      },
    });

    if (!sessions || sessions.length === 0) {
      return {
        success: true,
        data: [],
      };
    }

    // Enrich sessions with user's attendance data
    const now = new Date();
    const sessionsWithAttendance = await Promise.all(
      sessions.map(async (session) => {
        // Check if user has attendance record for this session
        const attendance = await prisma.attendance.findUnique({
          where: {
            userId_sessionId: {
              userId: user.id,
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
