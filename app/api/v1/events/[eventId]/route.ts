/**
 * GET /api/v1/events/[eventId]
 * Get a single event by ID
 *
 * PATCH /api/v1/events/[eventId]
 * Update an event (admin/district leader only, creator only for district leaders)
 *
 * DELETE /api/v1/events/[eventId]
 * Delete an event (admin only, creator only for district leaders)
 */

import { prisma } from "@/lib/prisma";
import {
  successResponse,
  ValidationError,
  ForbiddenError,
} from "@/lib/api-errors";
import { getAppSession } from "@/lib/session";
import { getEffectiveUserId } from "@/lib/utils";
import { updateEventSchema } from "@/lib/schema";
import { NextRequest } from "next/server";
import { Role } from "@/prisma/generated/enums";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ eventId: string }> }
) {
  try {
    const { user, iUser } = await getAppSession();
    const { eventId } = await context.params;

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

    // Fetch the event
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        _count: {
          select: { sessions: true },
        },
      },
    });

    if (!event) {
      return Response.json(
        { success: false, error: "Event not found" },
        { status: 404 }
      );
    }

    // Authorization: Check if user can view this event
    if (effectiveUser.role !== Role.ADMIN) {
      // Non-admin users can only view events in their district or multi-district events
      const canView =
        event.districtId === effectiveUser.districtId || event.districtId === null;
      if (!canView) {
        return Response.json(
          { success: false, error: "Forbidden" },
          { status: 403 }
        );
      }
    }

    const formattedEvent = {
      ...event,
      sessionCount: event._count.sessions,
      _count: undefined,
    };

    return Response.json(successResponse({ data: formattedEvent }));
  } catch (error) {
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch event",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ eventId: string }> }
) {
  try {
    const { user, iUser } = await getAppSession();
    const { eventId } = await context.params;
    const body = await req.json();

    // Validate request body with Zod schema
    const validation = updateEventSchema.safeParse(body);
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

    // Fetch the event
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return Response.json(
        { success: false, error: "Event not found" },
        { status: 404 }
      );
    }

    // AUTHORIZATION RULES
    // Only ADMIN can edit any event
    // DISTRICT_LEADER can only edit events they created in their district
    if (effectiveUser.role === Role.ADMIN) {
      // Admin can edit any event
    } else if (effectiveUser.role === Role.DISTRICT_LEADER) {
      // District leader can only edit events they created in their district
      if (event.creatorId !== effectiveUserId) {
        throw new ForbiddenError("You can only edit events you created");
      }
      if (event.districtId !== effectiveUser.districtId) {
        throw new ForbiddenError("You can only edit events in your district");
      }
    } else {
      throw new ForbiddenError("You don't have permission to edit events");
    }

    // Validate and prepare update data
    const updateData: any = {};
    const validatedData = validation.data;

    if (validatedData.title !== undefined) {
      updateData.title = validatedData.title;
    }

    if (validatedData.description !== undefined) {
      updateData.description = validatedData.description;
    }

    if (validatedData.type !== undefined) {
      // Only ADMIN can change event type
      if (effectiveUser.role !== Role.ADMIN && validatedData.type !== event.type) {
        throw new ForbiddenError("Only admins can change event type");
      }
      updateData.type = validatedData.type;
    }

    if (validatedData.startDate !== undefined) {
      updateData.startDate = new Date(validatedData.startDate);
    }

    if (validatedData.endDate !== undefined) {
      updateData.endDate = validatedData.endDate ? new Date(validatedData.endDate) : null;
    }

    if (validatedData.districtId !== undefined) {
      // Only ADMIN can change districtId
      if (
        effectiveUser.role !== Role.ADMIN &&
        validatedData.districtId !== event.districtId
      ) {
        throw new ForbiddenError("Only admins can change the district");
      }
      updateData.districtId = validatedData.districtId;
    }

    if (validatedData.minimumMinutesPerWeek !== undefined) {
      updateData.minimumMinutesPerWeek = validatedData.minimumMinutesPerWeek;
    }

    // Update the event
    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: updateData,
      include: {
        _count: {
          select: { sessions: true },
        },
      },
    });

    const formattedEvent = {
      ...updatedEvent,
      sessionCount: updatedEvent._count.sessions,
      _count: undefined,
    };

    return Response.json(successResponse({ data: formattedEvent }));
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
          error instanceof Error ? error.message : "Failed to update event",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  
  req: NextRequest,
  context: { params: Promise<{ eventId: string }> }
) {
  try {
    const { user, iUser } = await getAppSession();
    const { eventId } = await context.params;

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

    // Fetch the event
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return Response.json(
        { success: false, error: "Event not found" },
        { status: 404 }
      );
    }

    // AUTHORIZATION RULES
    // Only ADMIN can delete events
    // DISTRICT_LEADER can delete only events they created in their district
    if (effectiveUser.role === Role.ADMIN) {
      // Admin can delete any event
    } else if (effectiveUser.role === Role.DISTRICT_LEADER) {
      // District leader can only delete events they created in their district
      if (event.creatorId !== effectiveUserId) {
        throw new ForbiddenError("You can only delete events you created");
      }
      if (event.districtId !== effectiveUser.districtId) {
        throw new ForbiddenError("You can only delete events in your district");
      }
    } else {
      throw new ForbiddenError("You don't have permission to delete events");
    }

    // Delete the event
    await prisma.event.delete({
      where: { id: eventId },
    });

    return Response.json(
      successResponse({ data: { message: "Event deleted successfully" } })
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
          error instanceof Error ? error.message : "Failed to delete event",
      },
      { status: 500 }
    );
  }
}
