/**
 * GET /api/v1/attendance/[attendanceId]
 * Get a single attendance record
 *
 * PATCH /api/v1/attendance/[attendanceId]
 * Update attendance (arrival time only)
 * 
 * Authorization:
 * - ADMIN: can view/edit any attendance
 * - DISTRICT_LEADER: can view/edit attendance in their district
 * - PART_LEADER: can view/edit attendance for their voice part in their district
 * - MEMBER: can only view their own attendance, cannot edit
 */

import { prisma } from "@/lib/prisma";
import { calculateAttendancePercentage } from "@/lib/attendance-calc";
import {
  successResponse,
  ValidationError,
  ForbiddenError,
  NotFoundError,
} from "@/lib/api-errors";
import { getAppSession } from "@/lib/session";
import { getEffectiveUserId, getEffectiveUserRole } from "@/lib/utils";
import { updateAttendanceSchema } from "@/lib/schema";
import { Role } from "@/prisma/generated/enums";
import { NextRequest } from "next/server";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ attendanceId: string }> }
) {
  try {
    const { attendanceId } = await context.params;
    const { user, iUser } = await getAppSession();

    const effectiveUserId = getEffectiveUserId(user, iUser);
    const effectiveUserRole = getEffectiveUserRole(user, iUser);

    if (!effectiveUserId) {
      return Response.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Fetch the attendance record with voice part
    const attendance = await prisma.attendance.findUnique({
      where: { id: attendanceId },
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
            voicePart: true,
            districtId: true,
          },
        },
      },
    });

    if (!attendance) {
      throw new NotFoundError("Attendance record not found");
    }

    // Check authorization
    if (effectiveUserRole === Role.ADMIN) {
      // Admin can see all
    } else if (attendance.userId === effectiveUserId) {
      // User can see their own
    } else if (effectiveUserRole === Role.DISTRICT_LEADER) {
      // District leader can see attendance for users in their district
      if (attendance.user.districtId !== user?.districtId) {
        throw new ForbiddenError("Not authorized to view this attendance");
      }
    } else if (effectiveUserRole === Role.PART_LEADER) {
      // Part leader can only see attendance for users in their district and voice part
      if (
        attendance.user.districtId !== user?.districtId ||
        attendance.user.voicePart !== user?.voicePart
      ) {
        throw new ForbiddenError("Not authorized to view this attendance");
      }
    } else {
      // Regular members can only see their own
      throw new ForbiddenError("Not authorized to view this attendance");
    }

    return Response.json(
      successResponse({
        data: {
          id: attendance.id,
          userId: attendance.userId,
          sessionId: attendance.sessionId,
          arrivalTime: attendance.arrivalTime,
          percentageScore: attendance.percentageScore,
          session: {
            ...attendance.session,
            eventTitle: attendance.session.event.title,
            event: undefined,
          },
          user: attendance.user,
          createdAt: attendance.createdAt,
        },
      })
    );
  } catch (error) {
    if (
      error instanceof ValidationError ||
      error instanceof ForbiddenError ||
      error instanceof NotFoundError
    ) {
      return Response.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      );
    }

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

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ attendanceId: string }> }
) {
  try {
    const { attendanceId } = await params;
    const { user, iUser } = await getAppSession();
    const body = await req.json();

    // Validate request body with Zod schema
    const validation = updateAttendanceSchema.safeParse(body);
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

    const { arrivalTime } = validation.data;

    const effectiveUserId = getEffectiveUserId(user, iUser);
    const effectiveUserRole = getEffectiveUserRole(user, iUser);

    if (!effectiveUserId) {
      return Response.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Fetch the attendance record with voice part info
    const attendance = await prisma.attendance.findUnique({
      where: { id: attendanceId },
      include: {
        session: {
          select: {
            startTime: true,
            endTime: true,
          },
        },
        user: {
          select: {
            voicePart: true,
            districtId: true,
          },
        },
      },
    });

    if (!attendance) {
      throw new NotFoundError("Attendance record not found");
    }

    // Authorization: Check role-based permissions
    if (effectiveUserRole === Role.ADMIN) {
      // Admin can edit any attendance
    } else if (attendance.userId === effectiveUserId) {
      // DISTRICT_LEADER and PART_LEADER can edit their own
      if (
        effectiveUserRole !== Role.DISTRICT_LEADER &&
        effectiveUserRole !== Role.PART_LEADER
      ) {
        // Regular members and others cannot edit own
        throw new ForbiddenError("Cannot edit your own attendance");
      }
    } else if (effectiveUserRole === Role.DISTRICT_LEADER) {
      // District leaders can edit users in their district
      if (attendance.user.districtId !== user?.districtId) {
        throw new ForbiddenError(
          "District leaders can only edit attendance for users in their district"
        );
      }
    } else if (effectiveUserRole === Role.PART_LEADER) {
      // Part leaders can only edit users in their district and voice part
      if (
        attendance.user.districtId !== user?.districtId ||
        attendance.user.voicePart !== user?.voicePart
      ) {
        throw new ForbiddenError(
          "Part leaders can only edit attendance for users in their voice part and district"
        );
      }
    } else {
      // Regular members cannot edit anyone's attendance
      throw new ForbiddenError("Not authorized to edit attendance");
    }

    // Calculate new percentage score with updated arrival time
    const arrival = new Date(arrivalTime);
    const calculation = calculateAttendancePercentage(
      arrival,
      attendance.session.startTime,
      attendance.session.endTime
    );

    // Update attendance record
    const updated = await prisma.attendance.update({
      where: { id: attendanceId },
      data: {
        arrivalTime: arrival,
        percentageScore: calculation.percentageScore,
      },
      include: {
        session: {
          select: {
            event: { select: { title: true } },
          },
        },
      },
    });

    return Response.json(
      successResponse({
        data: {
          id: updated.id,
          userId: updated.userId,
          sessionId: updated.sessionId,
          arrivalTime: updated.arrivalTime,
          percentageScore: updated.percentageScore,
          details: {
            minutesLate: calculation.minutesLate,
            maxPercentage: calculation.maxPercentage,
            isOnTime: calculation.isOnTime,
            deductionPercentage: calculation.deductionPercentage,
          },
        },
        message: `Attendance updated to ${calculation.percentageScore}%`,
      })
    );
  } catch (error) {
    if (
      error instanceof ValidationError ||
      error instanceof ForbiddenError ||
      error instanceof NotFoundError
    ) {
      return Response.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      );
    }

    return Response.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to update attendance",
      },
      { status: 500 }
    );
  }
}
