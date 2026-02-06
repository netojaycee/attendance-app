"use client";

import { useEffect, useState } from "react";
import { AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getUserCurrentEventProgressAction } from "@/lib/actions/events.actions";
import { useAuthStore } from "@/lib/stores/auth-store";

interface ProgressData {
  eventId: string;
  eventTitle: string;
  targetPercentage: number;
  currentPercentage: number;
  sessionsAttended: number;
  totalSessions: number;
  noSessions?: boolean;
}

const CircularProgress = ({
  percentage,
  target,
}: {
  percentage: number;
  target: number;
}) => {
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;
  const isMeetingTarget = percentage >= target;

  return (
    <div className="relative w-48 h-48 mx-auto">
      <svg className="transform -rotate-90" width={192} height={192}>
        {/* Background circle */}
        <circle
          cx="96"
          cy="96"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          className="text-muted"
        />
        {/* Progress circle */}
        <circle
          cx="96"
          cy="96"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={`transition-all duration-500 ${
            isMeetingTarget ? "text-primary" : "text-orange-500"
          }`}
          strokeLinecap="round"
        />
      </svg>
      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-4xl font-bold text-foreground">{percentage}%</div>
        <div className="text-xs text-text-secondary mt-1">Current Progress</div>
      </div>
    </div>
  );
};

export function YourProgressSection() {
  const { isInitialized } = useAuthStore();
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProgress = async () => {
      if (!isInitialized) return;

      try {
        const result = await getUserCurrentEventProgressAction();
        // console.log("Progress result:", result);
        if (result.success) {
          setProgress((result as any).data);
        }
      } catch (error) {
        console.error("Failed to fetch progress:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProgress();
  }, [isInitialized]);

  if (!isInitialized || isLoading) {
    return (
      <div className="px-4 pb-6 pt-5">
        <Skeleton className="h-6 w-40 mb-4" />
        <Card className="border-border bg-card">
          <div className="p-6">
            <Skeleton className="h-48 w-48 rounded-full mx-auto mb-6" />
            <Skeleton className="h-4 w-full mb-3" />
            <Skeleton className="h-4 w-2/3 mx-auto" />
          </div>
        </Card>
      </div>
    );
  }

  // No active event
  if (!progress) {
    return (
      <>
        <div className="px-4 pb-3 pt-6">
          <h2 className="text-xl font-bold text-foreground">Your Progress</h2>
        </div>
        <div className="px-4 pb-6">
          <Card className="border-border bg-card">
            <div className="p-8 text-center">
              <div className="mb-4 text-4xl">📊</div>
              <h3 className="text-lg font-bold text-foreground mb-2">
                No Active Events
              </h3>
              <p className="text-text-secondary text-sm">
                Your progress will appear here once an event is active. Check
                back soon!
              </p>
            </div>
          </Card>
        </div>
      </>
    );
  }

  // No sessions scheduled yet
  if (progress.noSessions) {
    return (
      <>
        <div className="px-4 pb-3 pt-6">
          <h2 className="text-xl font-bold text-foreground">Your Progress</h2>
        </div>
        <div className="px-4 pb-6">
          <Card className="border-border bg-card">
            <div className="p-6">
              <h3 className="text-base font-bold text-foreground mb-2">
                {progress.eventTitle}
              </h3>
              <div className="flex items-center gap-2 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  No sessions scheduled yet for this event.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </>
    );
  }

  const isMeetingTarget =
    progress.currentPercentage >= progress.targetPercentage;
  const gap = progress.targetPercentage - progress.currentPercentage;

  return (
    <>
      {/* Section Header */}
      <div className="px-4 pb-3 pt-6">
        <h2 className="text-xl font-bold text-foreground">Your Progress</h2>
      </div>

      {/* Progress Card */}
      <div className="px-4 pb-6">
        <Card className="border-border bg-card p-6">
          {/* Event Title */}
          <h3 className="text-lg font-bold text-foreground mb-6 text-center">
            {progress.eventTitle}
          </h3>

          {/* Circular Progress */}
          <CircularProgress
            percentage={progress.currentPercentage}
            target={progress.targetPercentage}
          />

          {/* Target vs Current */}
          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-between p-3 bg-primary/10 dark:bg-primary/20 rounded-lg">
              <span className="text-sm font-medium text-foreground">
                Target Attendance
              </span>
              <span className="text-lg font-bold text-primary">
                {progress.targetPercentage}%
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <span className="text-sm font-medium text-foreground">
                Your Current
              </span>
              <span className="text-lg font-bold text-foreground">
                {progress.currentPercentage}%
              </span>
            </div>
          </div>

          {/* Status Message */}
          <div className="mt-4 p-3 rounded-lg bg-slate-50 dark:bg-slate-900/30">
            {isMeetingTarget ? (
              <p className="text-sm text-green-700 dark:text-green-400 flex items-center gap-2">
                <span className="text-lg">✅</span>
                You&apos;re meeting the attendance target!
              </p>
            ) : (
              <p className="text-sm text-orange-700 dark:text-orange-400 flex items-center gap-2">
                <span className="text-lg">⏱️</span>
                {gap}% more to reach target
              </p>
            )}
          </div>

          {/* Session Stats */}
          <div className="h-px bg-border my-5" />

          <div className="flex items-center justify-between text-sm">
            <div>
              <p className="text-text-secondary">Sessions Attended</p>
              <p className="text-xl font-bold text-foreground">
                {progress.sessionsAttended}/{progress.totalSessions}
              </p>
            </div>
            <div className="text-right">
              <p className="text-text-secondary">Attendance Rate</p>
              <p className="text-xl font-bold text-foreground">
                {progress.totalSessions > 0
                  ? Math.round(
                      (progress.sessionsAttended / progress.totalSessions) *
                        100,
                    )
                  : 0}
                %
              </p>
            </div>
          </div>

          {/* Info Text */}
          <p className="text-xs text-text-secondary italic mt-5 text-center">
            Progress updates automatically after each session.
          </p>
        </Card>
      </div>
    </>
  );
}
