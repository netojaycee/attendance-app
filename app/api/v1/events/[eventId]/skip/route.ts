/**
 * POST /api/v1/events/[eventId]/skip
 * Backdoor endpoint: Admin grants user direct entry to event without attendance
 * Sets skip to true and cumulative to 100
 * Authorization: ADMIN only
 */

import { prisma } from "@/lib/prisma";
import { getAppSession } from "@/lib/session";
import { Role } from "@/prisma/generated/enums";
import {
  successResponse,
  errorResponse,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "@/lib/api-errors";
import { NextRequest } from "next/server";

export async function POST(
  _req: NextRequest,
  context: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await context.params;
    const { user } = await getAppSession();
    const body = await _req.json();
    const { userId } = body;

    // Authorization: ADMIN only
    if (user.role !== Role.ADMIN) {
      throw new ForbiddenError("Only administrators can skip users");
    }

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
      return Response.json(
        {
          success: false,
          error: "User is already skipped for this event",
        },
        { status: 409 }
      );
    }

    // Create or update the summary record
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

    return Response.json(
      successResponse({
        data: summary,
        message: "User skipped successfully with direct entry granted",
      }),
      { status: 200 }
    );
  } catch (error) {
    if (
      error instanceof ForbiddenError ||
      error instanceof NotFoundError ||
      error instanceof ValidationError
    ) {
      return Response.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      );
    }

    const { response, statusCode } = errorResponse(
      error instanceof Error ? error.message : "Internal server error"
    );
    return Response.json(response, { status: statusCode });
  }
}
