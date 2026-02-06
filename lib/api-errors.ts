/**
 * API Response and Error Handling
 * Standardized response format for all API routes
 */

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ApiError {
  message: string;
  code: string;
  statusCode: number;
}

export class AppError extends Error {
  public statusCode: number;
  public code: string;

  constructor(message: string, statusCode: number = 500, code: string = "INTERNAL_ERROR") {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.name = "AppError";
  }
}

// Specific error classes
export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, "VALIDATION_ERROR");
    this.name = "ValidationError";
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = "Unauthorized") {
    super(message, 401, "UNAUTHORIZED");
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = "Forbidden") {
    super(message, 403, "FORBIDDEN");
    this.name = "ForbiddenError";
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = "Not found") {
    super(message, 404, "NOT_FOUND");
    this.name = "NotFoundError";
  }
}

export class ConflictError extends AppError {
  constructor(message: string = "Conflict") {
    super(message, 409, "CONFLICT");
    this.name = "ConflictError";
  }
}

/**
 * Create a success response
 */
export function successResponse<T>(data: T, message?: string): ApiResponse<T> {
  return {
    success: true,
    data,
    ...(message && { message }),
  };
}

/**
 * Create an error response
 */
export function errorResponse(
  error: string | AppError,
  statusCode?: number
): { response: ApiResponse; statusCode: number } {
  if (error instanceof AppError) {
    return {
      response: {
        success: false,
        error: error.message,
      },
      statusCode: error.statusCode,
    };
  }

  return {
    response: {
      success: false,
      error: typeof error === "string" ? error : "Internal server error",
    },
    statusCode: statusCode || 500,
  };
}

/**
 * Wrap an async handler to catch errors and return proper response
 * Usage: export const POST = handleApiRoute(async (req) => { ... })
 */
export function handleApiRoute(
  handler: (req: Request) => Promise<Response>
) {
  return async (req: Request) => {
    try {
      return await handler(req);
    } catch (error) {
      console.error("[API Error]", error);

      if (error instanceof AppError) {
        return Response.json(
          {
            success: false,
            error: error.message,
          },
          { status: error.statusCode }
        );
      }

      // Handle Prisma errors
      if (error instanceof Error) {
        if (error.message.includes("Unique constraint failed")) {
          return Response.json(
            {
              success: false,
              error: "This record already exists",
            },
            { status: 409 }
          );
        }

        if (error.message.includes("Record to delete does not exist")) {
          return Response.json(
            {
              success: false,
              error: "Record not found",
            },
            { status: 404 }
          );
        }
      }

      return Response.json(
        {
          success: false,
          error: "Internal server error",
        },
        { status: 500 }
      );
    }
  };
}

/**
 * Parse and validate JSON request body
 */
export async function parseBody<T>(req: Request): Promise<T> {
  try {
    return await req.json();
  } catch {
    throw new ValidationError("Invalid JSON in request body");
  }
}

/**
 * Validate required fields
 */
export function validateRequired(data: Record<string, unknown>, fields: string[]): void {
  for (const field of fields) {
    if (!data[field]) {
      throw new ValidationError(`Missing required field: ${field}`);
    }
  }
}