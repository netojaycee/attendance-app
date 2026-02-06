/**
 * Attendance Calculation Service
 * Pure calculation logic for attendance percentages
 * Separated for easy algorithm modification
 */

/**
 * Calculate session-level attendance percentage
 * Based on arrival time vs session start time and duration
 * 
 * FORMULA:
 *   Session Attendance % = 100% - (minutes_late / session_duration) × 100%
 * 
 * @param arrivalTime - User's arrival time (Date)
 * @param sessionStartTime - Session start time (Date)
 * @param sessionEndTime - Session end time (Date)
 * @returns Attendance percentage (0-100)
 */
export function calculateSessionAttendancePercentage(
  arrivalTime: Date,
  sessionStartTime: Date,
  sessionEndTime: Date
): number {
  // Calculate session duration in minutes
  const sessionDurationMs = sessionEndTime.getTime() - sessionStartTime.getTime();
  const sessionDurationMinutes = sessionDurationMs / (1000 * 60);

  // Calculate minutes late
  const minutesLateMs = Math.max(0, arrivalTime.getTime() - sessionStartTime.getTime());
  const minutesLate = minutesLateMs / (1000 * 60);

  // If arrived after end time or session duration is 0, return 0%
  if (minutesLate >= sessionDurationMinutes || sessionDurationMinutes === 0) {
    return 0;
  }

  // Calculate attendance percentage with linear penalty
  const attendancePercentage = 100 - (minutesLate / sessionDurationMinutes) * 100;

  // Clamp between 0 and 100
  return Math.max(0, Math.min(100, attendancePercentage));
}

/**
 * Calculate cumulative event attendance percentage
 * Handles both weeklyConstraint and non-constraint cases
 * 
 * @param userSessions - Array of sessions user attended with their details
 *   Each item: { sessionDurationMinutes: number, attendancePercentage: number }
 * @param eventWeeklyConstraint - Whether event has weekly constraint
 * @param minimumMinutesPerWeek - Required minutes for 100% (only used if constraint true)
 * @returns Cumulative attendance percentage (0-100)
 */
export function calculateCumulativeEventAttendance(
  userSessions: Array<{
    sessionDurationMinutes: number;
    attendancePercentage: number;
  }>,
  eventWeeklyConstraint: boolean,
  minimumMinutesPerWeek?: number
): number {
  // Handle no sessions
  if (userSessions.length === 0) {
    return 0;
  }

  // Calculate weighted attendance sum
  const weightedAttendanceSum = userSessions.reduce(
    (sum, session) =>
      sum + (session.sessionDurationMinutes * session.attendancePercentage) / 100,
    0
  );

  let cumulativePercentage: number;

  if (eventWeeklyConstraint && minimumMinutesPerWeek && minimumMinutesPerWeek > 0) {
    // CASE 1: Event WITH weeklyConstraint
    // Formula: Σ(duration × attendance%) / minimumMinutesPerWeek
    cumulativePercentage = (weightedAttendanceSum / minimumMinutesPerWeek) * 100;
  } else {
    // CASE 2: Event WITHOUT weeklyConstraint
    // Formula: Σ(duration × attendance%) / Σ(all_session_durations)
    const totalSessionDuration = userSessions.reduce(
      (sum, session) => sum + session.sessionDurationMinutes,
      0
    );

    if (totalSessionDuration === 0) {
      cumulativePercentage = 0;
    } else {
      cumulativePercentage = (weightedAttendanceSum / totalSessionDuration) * 100;
    }
  }

  // Clamp between 0 and 100
  return Math.max(0, Math.min(100, cumulativePercentage));
}

/**
 * Calculate attendance percentage change for a single attendance submission
 * Useful for delta updates
 * 
 * @param newAttendancePercentage - New session attendance %
 * @param sessionDurationMinutes - Duration of the session
 * @param previousCumulativePercentage - Previous cumulative %
 * @param previousTotalWeightedMinutes - Previous sum of (duration × attendance%)
 * @param totalMinutes - Total minutes (constraint or all sessions)
 * @returns Delta change in cumulative percentage
 */
export function calculateAttendancePercentageDelta(
  newAttendancePercentage: number,
  sessionDurationMinutes: number,
  previousCumulativePercentage: number,
  previousTotalWeightedMinutes: number,
  totalMinutes: number
): number {
  if (totalMinutes === 0) {
    return 0;
  }

  const newTotalWeightedMinutes =
    previousTotalWeightedMinutes +
    (sessionDurationMinutes * newAttendancePercentage) / 100;

  const newCumulativePercentage = (newTotalWeightedMinutes / totalMinutes) * 100;

  return newCumulativePercentage - previousCumulativePercentage;
}
