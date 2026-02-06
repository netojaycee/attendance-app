/**
 * Attendance Percentage Calculation
 *
 * Formula:
 * - Base: 100% per standard 2-hour session
 * - Deduction: 5% per 5 minutes late
 * - For sessions > 2 hours: treated as multiple sessions
 *   Example: 4-hour session = 2 × sessions = max 200%
 *
 * Sessions are open for submission starting at session start time
 * and close 3 days after session start time
 */

export interface SessionTimings {
  startTime: Date;
  endTime: Date;
  durationMinutes: number;
}

export interface AttendanceCalculation {
  percentageScore: number;
  minutesLate: number;
  maxPercentage: number;
  isOnTime: boolean;
  isLate: boolean;
  deductionPercentage: number;
}

/**
 * Calculate the maximum percentage for a session based on duration
 * Standard session: 120 minutes (2 hours) = 100%
 * Sessions are normalized to 2-hour blocks
 *
 * Example:
 * - 120 mins: 100%
 * - 240 mins: 200% (two 2-hour sessions)
 * - 180 mins: 150% (1.5 sessions, rounded up)
 */
export function getMaxPercentageForSession(durationMinutes: number): number {
  const standardSessionMinutes = 120; // 2 hours
  const sessionCount = Math.ceil(durationMinutes / standardSessionMinutes);
  return 100 * sessionCount;
}

/**
 * Calculate attendance percentage based on arrival time
 *
 * @param arrivalTime - When the user arrived (full timestamp)
 * @param sessionStart - When the session started (full timestamp)
 * @param sessionEnd - When the session ended (full timestamp)
 * @returns Attendance calculation with percentage and details
 */
export function calculateAttendancePercentage(
  arrivalTime: Date,
  sessionStart: Date,
  sessionEnd: Date
): AttendanceCalculation {
  const durationMs = sessionEnd.getTime() - sessionStart.getTime();
  const durationMinutes = durationMs / (1000 * 60);

  const maxPercentage = getMaxPercentageForSession(durationMinutes);

  // Calculate how many minutes late (negative if early)
  const minutesLateMs = arrivalTime.getTime() - sessionStart.getTime();
  const minutesLate = minutesLateMs / (1000 * 60);

  // If arrived at or before start time: 100% (or max for session)
  if (minutesLate <= 0) {
    return {
      percentageScore: maxPercentage,
      minutesLate: 0,
      maxPercentage,
      isOnTime: true,
      isLate: false,
      deductionPercentage: 0,
    };
  }

  // Deduct 5% per 5 minutes late
  // So every full 5 minutes = 5% deduction
  // 2.5 minutes = 5%, 5 minutes = 5%, 7.5 minutes = 10%, 10 minutes = 10%
  // Formula: Math.ceil(minutesLate / 5) * 5
  const deductionPercentage = Math.ceil(minutesLate / 5) * 5;

  const percentageScore = Math.max(0, maxPercentage - deductionPercentage);

  return {
    percentageScore: Math.round(percentageScore * 100) / 100, // Round to 2 decimals
    minutesLate: Math.round(minutesLate * 100) / 100,
    maxPercentage,
    isOnTime: false,
    isLate: true,
    deductionPercentage,
  };
}

/**
 * Check if a session is currently open for attendance submission
 *
 * Rules:
 * - Opens: At session start time
 * - Closes: 3 days after session start time
 *
 * @param sessionStart - When the session starts
 * @param currentTime - Current time (defaults to now)
 * @returns true if session is open for submissions
 */
export function isSessionOpen(sessionStart: Date, currentTime: Date = new Date()): boolean {
  const sessionStartTime = sessionStart.getTime();
  const currentTime_ms = currentTime.getTime();
  const closingTime = sessionStartTime + 3 * 24 * 60 * 60 * 1000; // 3 days

  return currentTime_ms >= sessionStartTime && currentTime_ms <= closingTime;
}

/**
 * Get the time remaining to submit attendance for a session
 *
 * @param sessionStart - When the session starts
 * @param currentTime - Current time (defaults to now)
 * @returns Minutes remaining, or -1 if session is closed
 */
export function getMinutesRemainingToSubmit(
  sessionStart: Date,
  currentTime: Date = new Date()
): number {
  const sessionStartTime = sessionStart.getTime();
  const currentTime_ms = currentTime.getTime();
  const closingTime = sessionStartTime + 3 * 24 * 60 * 60 * 1000; // 3 days

  if (currentTime_ms < sessionStartTime) {
    // Session hasn't started yet
    return (sessionStartTime - currentTime_ms) / (1000 * 60);
  }

  if (currentTime_ms > closingTime) {
    // Session is closed
    return -1;
  }

  // Session is open
  const minutesRemaining = (closingTime - currentTime_ms) / (1000 * 60);
  return Math.ceil(minutesRemaining);
}

/**
 * Format minutes remaining into a human-readable string
 */
export function formatTimeRemaining(minutes: number): string {
  if (minutes < 0) return "Closed";
  if (minutes === 0) return "Closing now";

  const days = Math.floor(minutes / (60 * 24));
  const hours = Math.floor((minutes % (60 * 24)) / 60);
  const mins = Math.floor(minutes % 60);

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (mins > 0 && parts.length < 2) parts.push(`${mins}m`);

  return parts.join(" ");
}

/**
 * Calculate weekly attendance minutes for multi-district events
 * Used to check if user meets minimum 4-hour requirement
 *
 * @param attendances - List of attendance records with percentages
 * @param sessionDurations - Map of session IDs to duration in minutes
 * @returns Total minutes attended in the week
 */
export function calculateWeeklyAttendanceMinutes(
  attendances: Array<{ percentageScore: number; sessionId: string }>,
  sessionDurations: Map<string, number>
): number {
  return attendances.reduce((total, record) => {
    const sessionDuration = sessionDurations.get(record.sessionId) || 0;
    // Calculate actual minutes = (percentage / 100) * duration
    const minutesAttended = (record.percentageScore / 100) * sessionDuration;
    return total + minutesAttended;
  }, 0);
}

/**
 * Check if user meets minimum weekly requirement
 * Default: 240 minutes (4 hours) per week
 */
export function meetsWeeklyRequirement(
  weeklyMinutes: number,
  minimumMinutesRequired: number = 240
): boolean {
  return weeklyMinutes >= minimumMinutesRequired;
}