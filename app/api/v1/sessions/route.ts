/**
 * GET /api/v1/sessions
 * List sessions (with optional eventId and districtId filters)
 *
 * POST /api/v1/sessions
 * Create a new session (admin/district leader only)
 */

import { prisma } from "@/lib/prisma";
import {
  successResponse,
  ValidationError,
  ForbiddenError,
} from "@/lib/api-errors";
import { getAppSession } from "@/lib/session";
import { getEffectiveUserId } from "@/lib/utils";
import { createSessionSchema } from "@/lib/schema";
import { Role } from "@/prisma/generated/enums";

export async function GET(req: Request) {
  try {
    const { user, iUser } = await getAppSession();
    const url = new URL(req.url);
    const eventId = url.searchParams.get("eventId");
    const districtId = url.searchParams.get("districtId");

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

    const where: any = {};

    if (eventId) {
      where.eventId = eventId;
    }

    if (districtId && effectiveUser.role === Role.ADMIN) {
      where.districtId = districtId;
    }

    // Non-admin users only see sessions in their district
    if (effectiveUser.role !== Role.ADMIN) {
      where.districtId = effectiveUser.districtId;
    }

    const sessions = await prisma.session.findMany({
      where,
      include: {
        event: { select: { title: true } },
        _count: { select: { attendances: true } },
      },
      orderBy: { startTime: "asc" },
    });

    const formattedSessions = sessions.map((session) => ({
      ...session,
      attendanceCount: session._count.attendances,
      _count: undefined,
    }));

    return Response.json(
      successResponse({
        data: formattedSessions,
        total: formattedSessions.length,
      })
    );
  } catch (error) {
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch sessions",
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
    const validation = createSessionSchema.safeParse(body);
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

    const { eventId, date, startTime, endTime, durationMinutes, districtId } =
      validation.data;

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

    // AUTHORIZATION RULES
    // Only ADMIN and DISTRICT_LEADER can create sessions
    if (
      effectiveUser.role !== Role.ADMIN &&
      effectiveUser.role !== Role.DISTRICT_LEADER
    ) {
      throw new ForbiddenError("You don't have permission to create sessions");
    }

    // DISTRICT_LEADER can only create sessions for their district
    if (
      effectiveUser.role === Role.DISTRICT_LEADER &&
      effectiveUser.districtId !== districtId
    ) {
      throw new ForbiddenError(
        "You can only create sessions in your district"
      );
    }

    // Verify event exists
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new ValidationError("Event not found");
    }

    // For SINGLE_DISTRICT events, verify the session district matches the event district
    if (event.districtId && event.districtId !== districtId) {
      throw new ForbiddenError(
        "Session district does not match event district"
      );
    }

    const session = await prisma.session.create({
      data: {
        eventId,
        date: new Date(date || startTime),
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        durationMinutes,
        districtId,
        createdById: effectiveUserId,
      },
      include: {
        event: { select: { title: true } },
      },
    });

    const formattedSession = {
      ...session,
      eventTitle: session.event.title,
      event: undefined,
    };

    return Response.json(
      successResponse({ data: formattedSession }),
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
          error instanceof Error ? error.message : "Failed to create session",
      },
      { status: 500 }
    );
  }
}