"use client";

import { useEffect, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Calendar, Clock, Timer, CheckCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  submitAttendanceAction,
  getAttendanceAction,
} from "@/lib/actions/attendance.actions";
import { useNextSession } from "@/lib/hooks/use-sessions";
import { useAuthStore } from "@/lib/stores/auth-store";

// Zod schema for attendance
const attendanceSchema = z.object({
  arrivalTime: z.string().min(1, "Arrival time is required"),
});

type AttendanceFormData = z.infer<typeof attendanceSchema>;

interface Session {
  id: string;
  startTime: Date | string;
  endTime: Date | string;
  event: {
    id: string;
    title: string;
    type?: string;
  };
}

export function NextSessionCard() {
  const { isInitialized } = useAuthStore();
  const { data: sessionData, isLoading } = useNextSession();
  const [message, setMessage] = useState("");
  const [isSessionStarted, setIsSessionStarted] = useState(false);
  const [hasSubmittedAttendance, setHasSubmittedAttendance] = useState(false);
  const [isCheckingAttendance, setIsCheckingAttendance] = useState(false);
  const [submittedScore, setSubmittedScore] = useState<number | null>(null);

  const session = sessionData?.data as Session | undefined;
  console.log(session, "session");
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AttendanceFormData>({
    resolver: zodResolver(attendanceSchema),
  });

  // Check if session has started and update every minute
  const checkSessionStart = useCallback((sess: Session) => {
    const startTime = new Date(sess.startTime);
    const now = new Date();
    setIsSessionStarted(now >= startTime);
  }, []);

  // Check if user has already submitted attendance
  const checkAttendanceSubmission = useCallback(async (sessionId: string) => {
    setIsCheckingAttendance(true);
    try {
      const result = await getAttendanceAction(sessionId);
      // If attendance is found (exists in database), user has already submitted
      setHasSubmittedAttendance(result.success && !!result.data);
      if (result.success && result.data) {
        setSubmittedScore((result.data as any).percentageScore ?? null);
      }
    } catch (error) {
      console.error("Error checking attendance:", error);
    } finally {
      setIsCheckingAttendance(false);
    }
  }, []);

  useEffect(() => {
    if (!session) return;
    //eslint-disable-next-line
    checkSessionStart(session); // initial
    checkAttendanceSubmission(session.id);

    const interval = setInterval(() => {
      checkSessionStart(session);
    }, 60000);

    return () => clearInterval(interval);
  }, [session, checkSessionStart, checkAttendanceSubmission]);

  const onSubmit = async (data: AttendanceFormData) => {
    if (!session) return;

    if (hasSubmittedAttendance) {
      setMessage("You have already submitted attendance for this session");
      return;
    }

    if (!isSessionStarted) {
      setMessage("You can only submit attendance once the session has started");
      return;
    }

    try {
      const arrivalDate = new Date(session.startTime);
      const [hours, minutes] = data.arrivalTime.split(":");
      arrivalDate.setHours(parseInt(hours), parseInt(minutes));

      const result = await submitAttendanceAction(
        session.id,
        arrivalDate.toISOString(),
      );

      if (result.success) {
        setMessage("Attendance submitted successfully!");
        setHasSubmittedAttendance(true);
        reset();
      } else {
        setMessage(result.error || "Failed to submit attendance");
      }
    } catch (error) {
      console.error(error);
      setMessage("Error submitting attendance");
    }
  };

  if (!isInitialized || isLoading) {
    return (
      <>
        {/* Section Header */}
        <div className="px-4 pb-3 pt-5">
          <h2 className="text-xl font-bold text-foreground">Next Session</h2>
        </div>

        {/* Session Card Skeleton */}
        <div className="px-4">
          <Card className="border-border bg-card">
            <div className="p-5">
              {/* Header Skeleton */}
              <div className="space-y-3">
                <Skeleton className="h-8 w-3/4 rounded-md" />
                <Skeleton className="h-4 w-1/2 rounded-md" />
              </div>

              {/* Details Skeleton */}
              <div className="mt-4 space-y-2">
                <Skeleton className="h-4 w-full rounded-md" />
                <Skeleton className="h-4 w-full rounded-md" />
              </div>

              {/* Divider */}
              <div className="h-px bg-border my-4" />

              {/* Form Skeleton */}
              <div className="space-y-3">
                <Skeleton className="h-6 w-1/3 rounded-md" />
                <div className="flex gap-2">
                  <Skeleton className="flex-1 h-10 rounded-md" />
                  <Skeleton className="w-24 h-10 rounded-md" />
                </div>
                <Skeleton className="h-4 w-full rounded-md" />
              </div>
            </div>
          </Card>
        </div>
      </>
    );
  }

  // No upcoming sessions
  if (!session) {
    return (
      <>
        <div className="px-4 pb-3 pt-5">
          <h2 className="text-xl font-bold text-foreground">Next Session</h2>
        </div>
        <div className="px-4">
          <Card className="border-border bg-card">
            <div className="p-8 text-center">
              <div className="mb-4 text-4xl">🎉</div>
              <h3 className="text-xl font-bold text-foreground mb-2">
                No Upcoming Sessions
              </h3>
              <p className="text-text-secondary mb-4">
                You&apos;re all caught up! Check back soon for upcoming
                sessions.
              </p>
              <p className="text-sm text-muted-foreground italic">
                New sessions will appear here as they&apos;re scheduled.
              </p>
            </div>
          </Card>
        </div>
      </>
    );
  }

  const startTime = new Date(session.startTime);
  const endTime = new Date(session.endTime);
  const startTimeStr = startTime.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  const endTimeStr = endTime.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  const dateStr = startTime.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  return (
    <>
      {/* Section Header */}
      <div className="px-4 pb-3 pt-5">
        <h2 className="text-xl font-bold text-foreground">Next Session</h2>
      </div>

      {/* Session Card */}
      <div className="px-4">
        <Card className="border-border bg-card">
          <div className="p-5">
            {/* Header with Title */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-foreground mt-2">
                  {session.event.title}
                </h3>

                {/* Session Details */}
                <div className="mt-3 space-y-2 text-sm text-text-secondary">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>{dateStr}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>
                      {startTimeStr} - {endTimeStr}
                    </span>
                  </div>
                  {/* <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>Main Hall, City Chapel</span>
                  </div> */}
                </div>
              </div>

              {/* Session Image */}
              {/* <div className="shrink-0">
                <img
                  src="https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=200&h=200&fit=crop"
                  alt="Chapel interior"
                  className="w-24 h-24 rounded-lg object-cover border border-border"
                />
              </div> */}
            </div>

            {/* Divider */}
            <div className="h-px bg-border my-4" />

            {/* Attendance Form */}
            <div className="space-y-3">
              <label className="block text-base font-semibold text-foreground">
                Mark Attendance
              </label>

              {hasSubmittedAttendance && (
                <div className="space-y-3">
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md p-3 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 shrink-0" />
                    <p className="text-sm text-green-800 dark:text-green-200">
                      You have already submitted attendance for this session
                    </p>
                  </div>
                  {submittedScore !== null && (
                    <div className="bg-primary/10 border border-primary/30 rounded-md p-3">
                      <p className="text-sm text-text-secondary mb-2">Score</p>
                      <p className="text-2xl font-bold text-primary">
                        {Math.round(submittedScore)}%
                      </p>
                    </div>
                  )}
                </div>
              )}

              {!isSessionStarted && !hasSubmittedAttendance && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md p-3">
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    ⏰ Attendance opens when the session starts at{" "}
                    {startTimeStr}
                  </p>
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="flex gap-2">
                <div className="relative flex-1">
                  <Timer className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="time"
                    disabled={
                      !isSessionStarted ||
                      hasSubmittedAttendance ||
                      isCheckingAttendance
                    }
                    placeholder="e.g. 6:45 PM"
                    className="pl-10 disabled:opacity-50 disabled:cursor-not-allowed"
                    {...register("arrivalTime")}
                  />
                </div>
                <Button
                  type="submit"
                  disabled={
                    isSubmitting ||
                    !isSessionStarted ||
                    hasSubmittedAttendance ||
                    isCheckingAttendance
                  }
                  className="bg-primary hover:bg-primary/90 text-slate-900 font-bold px-6 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting
                    ? "Submitting..."
                    : hasSubmittedAttendance
                      ? "Submitted"
                      : "Submit"}
                </Button>
              </form>

              {errors.arrivalTime && (
                <p className="text-xs text-destructive">
                  {errors.arrivalTime.message}
                </p>
              )}

              {message && (
                <p
                  className={`text-xs italic ${
                    message.includes("success")
                      ? "text-green-600"
                      : message.includes("already")
                        ? "text-green-600"
                        : "text-red-600"
                  }`}
                >
                  {message}
                </p>
              )}

              {/* <p className="text-xs text-muted-foreground italic">
                Please log your arrival at least 15 minutes before the start.
              </p> */}
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}
