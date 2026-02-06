/**
 * GET /api/v1/attendance/[attendanceId]
 * Get specific attendance record details
 *
 * PATCH /api/v1/attendance/[attendanceId]
 * Update attendance record (arrival time)
 *
 * DELETE /api/v1/attendance/[attendanceId]
 * Delete attendance record
 */

import { NextRequest, NextResponse } from "next/server";
import {
  getAttendance,
  submitAttendance,
  deleteAttendance,
} from "@/lib/services/attendance.service";
import { getAppSession } from "@/lib/session";
import { handleApiError, NotFoundError } from "@/lib/api-errors";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: {
    attendanceId: string;
  };
}

// GET /api/v1/attendance/[attendanceId]
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { user } = await getAppSession();

    if (!user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { attendanceId } = params;

    // Verify user owns this attendance record
    const attendance = await prisma.attendance.findUnique({
      where: { id: attendanceId },
      select: {
        userId: true,
        id: true,
        sessionId: true,
        arrivalTime: true,
        percentage: true,
        createdAt: true,
        updatedAt: true,
        session: {
          select: {
            id: true,
            title: true,
            startTime: true,
            endTime: true,
            eventId: true,
          },
        },
      },
    });

    if (!attendance) {
      return NextResponse.json(
        { success: false, error: "Attendance record not found" },
        { status: 404 }
      );
    }

    if (attendance.userId !== user.id) {
      return NextResponse.json(
        { success: false, error: "Not authorized to view this record" },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: attendance,
      },
      { status: 200 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}

// PATCH /api/v1/attendance/[attendanceId]
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const { user } = await getAppSession();

    if (!user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { attendanceId } = params;
    const body = await req.json();
    const { arrivalTime } = body;

    if (!arrivalTime) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required field: arrivalTime",
        },
        { status: 400 }
      );
    }

    // Verify user owns this attendance record
    const existingAttendance = await prisma.attendance.findUnique({
      where: { id: attendanceId },
      select: {
        userId: true,
        sessionId: true,
      },
    });

    if (!existingAttendance) {
      return NextResponse.json(
        { success: false, error: "Attendance record not found" },
        { status: 404 }
      );
    }

    if (existingAttendance.userId !== user.id) {
      return NextResponse.json(
        { success: false, error: "Not authorized to update this record" },
        { status: 403 }
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

    // Submit attendance (handles update internally)
    const result = await submitAttendance(
      user.id,
      existingAttendance.sessionId,
      parsedArrivalTime
    );

    return NextResponse.json(
      {
        success: true,
        data: result.attendance,
        message: result.message,
      },
      { status: 200 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/v1/attendance/[attendanceId]
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const { user } = await getAppSession();

    if (!user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { attendanceId } = params;

    // Delete attendance using service (includes authorization check)
    const result = await deleteAttendance(attendanceId, user.id);

    return NextResponse.json(
      {
        success: true,
        message: result.message,
      },
      { status: 200 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
