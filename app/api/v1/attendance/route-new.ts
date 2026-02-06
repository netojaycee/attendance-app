/**
 * GET /api/v1/attendance
 * Get all attendance records for the current user
 * 
 * Query params:
 * - eventId (optional): Filter by event
 * - sessionId (optional): Get specific session attendance
 *
 * POST /api/v1/attendance
 * Submit attendance for a session
 * 
 * Request body:
 * {
 *   sessionId: string,
 *   arrivalTime: ISO 8601 string
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import {
  submitAttendance,
  getAttendance,
  getEventAttendances,
  getUserEventAttendanceSummaries,
} from "@/lib/services/attendance.service";
import { getAppSession } from "@/lib/session";

// GET /api/v1/attendance
export async function GET(req: NextRequest) {
  try {
    const { user } = await getAppSession();

    if (!user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse query parameters
    const searchParams = req.nextUrl.searchParams;
    const eventId = searchParams.get("eventId");
    const sessionId = searchParams.get("sessionId");

    if (sessionId && eventId) {
      // Get specific session attendance
      const attendance = await getAttendance(user.id, sessionId);
      return NextResponse.json(
        {
          success: true,
          data: attendance,
        },
        { status: 200 }
      );
    } else if (eventId) {
      // Get all attendances for an event
      const attendances = await getEventAttendances(user.id, eventId);
      return NextResponse.json(
        {
          success: true,
          data: attendances,
        },
        { status: 200 }
      );
    } else {
      // Get all event attendance summaries
      const summaries = await getUserEventAttendanceSummaries(user.id);
      return NextResponse.json(
        {
          success: true,
          data: summaries,
        },
        { status: 200 }
      );
    }
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/v1/attendance
export async function POST(req: NextRequest) {
  try {
    const { user } = await getAppSession();

    if (!user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { sessionId, arrivalTime } = body;

    // Validate required fields
    if (!sessionId || !arrivalTime) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: sessionId, arrivalTime",
        },
        { status: 400 }
      );
    }

    // Parse arrival time
    const parsedArrivalTime = new Date(arrivalTime);
    if (isNaN(parsedArrivalTime.getTime())) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid arrivalTime format. Expected ISO 8601 string.",
        },
        { status: 400 }
      );
    }

    // Submit attendance using service
    const result = await submitAttendance(user.id, sessionId, parsedArrivalTime);

    return NextResponse.json(
      {
        success: true,
        data: result.attendance,
        message: result.message,
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
