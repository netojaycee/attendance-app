/**
 * GET /api/v1/events
 * List events
 *
 * POST /api/v1/events
 * Create a new event (admin/district leader only)
 */

import { prisma } from "@/lib/prisma";
import {
  successResponse,
  ValidationError,
  ForbiddenError,
} from "@/lib/api-errors";
import { getAppSession } from "@/lib/session";
import { getEffectiveUserId } from "@/lib/utils";
import { createEventSchema } from "@/lib/schema";
import { EventType, Role } from "@/prisma/generated/enums";

export async function GET(req: Request) {
  try {
    const { user, iUser } = await getAppSession();
    const url = new URL(req.url);
    const type = url.searchParams.get("type");
    const districtId = url.searchParams.get("districtId");

    // Get the effective user ID (handles impersonation)
    const effectiveUserId = getEffectiveUserId(user, iUser);

    if (!effectiveUserId) {
      return Response.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Fetch the effective user from DB to get all necessary data
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

    // For non-admin users, only show events in their district or multi-district events
    if (effectiveUser.role !== Role.ADMIN) {
      where.OR = [
        { districtId: effectiveUser.districtId }, // Single-district events in their district
        { districtId: null }, // All multi-district events
      ];
    } else if (districtId) {
      // Admin filtering by district
      where.districtId = districtId;
    }

    if (type) {
      where.type = type;
    }

    const events = await prisma.event.findMany({
      where,
      include: {
        _count: {
          select: { sessions: true },
        },
      },
      orderBy: { startDate: "desc" },
    });

    const formattedEvents = events.map((event) => ({
      ...event,
      sessionCount: event._count.sessions,
      _count: undefined,
    }));

    return Response.json(
      successResponse({
        data: formattedEvents,
        total: formattedEvents.length,
      })
    );
  } catch (error) {
    return Response.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch events",
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
    const validation = createEventSchema.safeParse(body);
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

    const { title, description, type, startDate, endDate, districtId, minimumMinutesPerWeek } =
      validation.data;

    // Get the effective user (handles impersonation)
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
    // Only ADMIN can create MULTI_DISTRICT events
    if (type === "MULTI_DISTRICT" && effectiveUser.role !== Role.ADMIN) {
      throw new ForbiddenError(
        "Only admins can create multi-district events"
      );
    }

    // For SINGLE_DISTRICT events, districtId is required
    if (type === EventType.SINGLE_DISTRICT && !districtId) {
      throw new ValidationError("District required for single-district events");
    }

    // DISTRICT_LEADER can only create events in their own district
    if (effectiveUser.role === Role.DISTRICT_LEADER) {
      if (!districtId || districtId !== effectiveUser.districtId) {
        throw new ForbiddenError(
          "You can only create events in your own district"
        );
      }
    }

    const event = await prisma.event.create({
      data: {
        title,
        description: description || null,
        type,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        districtId: districtId || null,
        creatorId: effectiveUserId,
        minimumMinutesPerWeek,
      },
    });

    return Response.json(successResponse({ data: event }), { status: 201 });
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
          error instanceof Error ? error.message : "Failed to create event",
      },
      { status: 500 }
    );
  }
}
