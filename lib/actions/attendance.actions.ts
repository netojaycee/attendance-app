"use server";

/**
 * Attendance Server Actions
 * Client-facing actions for attendance tracking
 */

import { getAppSession } from "@/lib/session";
import {
  submitAttendance,
  getAttendance,
  getEventAttendances,
  getEventAttendanceSummary,
  getUserEventAttendanceSummaries,
  deleteAttendance,
} from "@/lib/services/attendance.service";

/**
 * Submit attendance for a session
 */
export async function submitAttendanceAction(
  sessionId: string,
  arrivalTime: string
) {
  try {
    const { user } = await getAppSession();

    if (!user?.id) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    const result = await submitAttendance(user.id, sessionId, arrivalTime);

    return {
      success: true,
      data: result.attendance,
      message: result.message,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to submit attendance",
    };
  }
}

/**
 * Get specific attendance record
 */
export async function getAttendanceAction(sessionId: string) {
  try {
    const { user } = await getAppSession();

    if (!user?.id) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    const attendance = await getAttendance(user.id, sessionId);

    return {
      success: true,
      data: attendance,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch attendance",
    };
  }
}

/**
 * Get all attendance records for an event
 */
export async function getEventAttendancesAction(eventId: string) {
  try {
    const { user } = await getAppSession();

    if (!user?.id) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    const attendances = await getEventAttendances(user.id, eventId);

    return {
      success: true,
      data: attendances,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch attendances",
    };
  }
}

/**
 * Get cumulative attendance summary for an event
 */
export async function getEventAttendanceSummaryAction(eventId: string) {
  try {
    const { user } = await getAppSession();

    if (!user?.id) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    const summary = await getEventAttendanceSummary(user.id, eventId);

    return {
      success: true,
      data: summary,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch attendance summary",
    };
  }
}

/**
 * Get all event attendance summaries for current user
 */
export async function getUserEventAttendanceSummariesAction() {
  try {
    const { user } = await getAppSession();

    if (!user?.id) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    const summaries = await getUserEventAttendanceSummaries(user.id);

    return {
      success: true,
      data: summaries,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch attendance summaries",
    };
  }
}

/**
 * Delete attendance record
 */
export async function deleteAttendanceAction(attendanceId: string) {
  try {
    const { user } = await getAppSession();

    if (!user?.id) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    const result = await deleteAttendance(attendanceId, user.id);

    return {
      success: true,
      message: result.message,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete attendance",
    };
  }
}
