import { Role, EventType, VoicePart } from "@/prisma/generated/enums";
import { z } from "zod";

export const signUpSchema = z.object({
  role: z.enum(Role).optional(),
  email: z.string().email({ message: "Invalid email address" }),
  firstName: z.string().min(1, { message: "First name is required" }),
  lastName: z.string().min(1, { message: "Last name is required" }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters long" }),
});

export type SignUpData = z.infer<typeof signUpSchema>;

export const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(1, { message: "Password is required" }),
});

export type LoginData = z.infer<typeof loginSchema>;

/**
 * Create Event Schema
 * Used for POST /api/v1/events
 */
export const createEventSchema = z.object({
  title: z
    .string()
    .min(1, { message: "Title is required" })
    .max(255, { message: "Title must be less than 255 characters" }),
  description: z
    .string()
    .max(1000, { message: "Description must be less than 1000 characters" })
    .optional()
    .nullable(),
  type: z.enum(EventType, {
    message: "Invalid event type",
  }),
  startDate: z
    .string()
    .datetime({ message: "Start date must be a valid ISO datetime" }),
  endDate: z
    .string()
    .datetime({ message: "End date must be a valid ISO datetime" })
    .optional()
    .nullable(),
  districtId: z.string().optional().nullable(),
  weeklyConstraint: z.boolean().default(false),
  minimumMinutesPerWeek: z
    .number()
    .int()
    .min(0, { message: "Minimum minutes per week must be a positive number" })
    .optional()
    .default(240),
}).refine(
  (data) => {
    // If weeklyConstraint is true, minimumMinutesPerWeek is required
    if (data.weeklyConstraint && !data.minimumMinutesPerWeek) {
      return false;
    }
    return true;
  },
  {
    message: "minimumMinutesPerWeek is required when weeklyConstraint is true",
    path: ["minimumMinutesPerWeek"],
  }
);

export type CreateEventData = z.infer<typeof createEventSchema>;

/**
 * Update Event Schema
 * Used for PATCH /api/v1/events/[eventId]
 * All fields are optional for partial updates
 */
export const updateEventSchema = z.object({
  title: z
    .string()
    .min(1, { message: "Title is required" })
    .max(255, { message: "Title must be less than 255 characters" })
    .optional(),
  description: z
    .string()
    .max(1000, { message: "Description must be less than 1000 characters" })
    .optional()
    .nullable(),
  type: z
    .enum(EventType, {
      message: "Invalid event type",
    })
    .optional(),
  startDate: z
    .string()
    .datetime({ message: "Start date must be a valid ISO datetime" })
    .optional(),
  endDate: z
    .string()
    .datetime({ message: "End date must be a valid ISO datetime" })
    .optional()
    .nullable(),
  districtId: z.string().optional().nullable(),
  weeklyConstraint: z.boolean().optional(),
  minimumMinutesPerWeek: z
    .number()
    .int()
    .min(0, { message: "Minimum minutes per week must be a positive number" })
    .optional(),
}).refine(
  (data) => {
    // If weeklyConstraint is being set to true, minimumMinutesPerWeek must be provided
    if (data.weeklyConstraint === true && !data.minimumMinutesPerWeek) {
      return false;
    }
    return true;
  },
  {
    message: "minimumMinutesPerWeek is required when weeklyConstraint is true",
    path: ["minimumMinutesPerWeek"],
  }
);

export type UpdateEventData = z.infer<typeof updateEventSchema>;
/**
 * Create Session Schema
 * Used for POST /api/v1/sessions
 */
export const createSessionSchema = z.object({
  eventId: z.string().min(1, { message: "Event ID is required" }),
  date: z
    .string()
    .datetime({ message: "Date must be a valid ISO datetime" })
    .optional(),
  startTime: z
    .string()
    .datetime({ message: "Start time must be a valid ISO datetime" }),
  endTime: z
    .string()
    .datetime({ message: "End time must be a valid ISO datetime" }),
  durationMinutes: z
    .number()
    .int()
    .positive({ message: "Duration must be a positive number" }),
  districtId: z.string().min(1, { message: "District ID is required" }),
});

export type CreateSessionData = z.infer<typeof createSessionSchema>;
/**
 * Create Attendance Schema (Submit Attendance)
 * Used for POST /api/v1/attendance
 */
export const createAttendanceSchema = z.object({
  sessionId: z.string().min(1, { message: "Session ID is required" }),
  arrivalTime: z
    .string()
    .datetime({ message: "Arrival time must be a valid ISO datetime" }),
});

export type CreateAttendanceData = z.infer<typeof createAttendanceSchema>;

/**
 * Update Attendance Schema
 * Used for PATCH /api/v1/attendance/[attendanceId]
 * Only arrivalTime can be updated
 */
export const updateAttendanceSchema = z.object({
  arrivalTime: z
    .string()
    .datetime({ message: "Arrival time must be a valid ISO datetime" }),
});

export type UpdateAttendanceData = z.infer<typeof updateAttendanceSchema>;
/**
 * Update Session Schema
 * Used for PATCH /api/v1/sessions/[sessionId]
 * All fields are optional for partial updates
 */
export const updateSessionSchema = z.object({
  startTime: z
    .string()
    .datetime({ message: "Start time must be a valid ISO datetime" })
    .optional(),
  endTime: z
    .string()
    .datetime({ message: "End time must be a valid ISO datetime" })
    .optional(),
  durationMinutes: z
    .number()
    .int()
    .positive({ message: "Duration must be a positive number" })
    .optional(),
  date: z
    .string()
    .datetime({ message: "Date must be a valid ISO datetime" })
    .optional(),
});

export type UpdateSessionData = z.infer<typeof updateSessionSchema>;

/**
 * Create User Schema
 * Used for POST /api/v1/users
 */
export const createUserSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  firstName: z
    .string()
    .min(1, { message: "First name is required" })
    .max(100, { message: "First name must be less than 100 characters" }),
  lastName: z
    .string()
    .min(1, { message: "Last name is required" })
    .max(100, { message: "Last name must be less than 100 characters" }),
  voicePart: z.enum(VoicePart).optional().default(VoicePart.SOPRANO),
  instrument: z.string().optional().nullable(),
  role: z.enum(Role).optional().default(Role.MEMBER),
  districtId: z.string().min(1, { message: "District ID is required" }),
});

export type CreateUserData = z.infer<typeof createUserSchema>;

export const BulkUserSchema = z.object({
  email: z.string().email("Invalid email format"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  voicePart: z.enum(VoicePart).optional().default(VoicePart.SOPRANO),
  role: z
    .enum(["ADMIN", "DISTRICT_LEADER", "PART_LEADER", "MEMBER"])
    .optional(),
  districtId: z.string().min(1, "District ID is required"),
  instrument: z.string().optional(),
});

export type BulkUser = z.infer<typeof BulkUserSchema>;
