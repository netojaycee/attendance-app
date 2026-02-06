"use client";

import { useEffect, useState } from "react";
import { X, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getEventSessionsForUserAction } from "@/lib/actions/events.actions";

interface SessionData {
  id: string;
  startTime: Date;
  endTime: Date;
  durationMinutes: number;
  date: Date;
  isPast: boolean;
  isCurrent: boolean;
  isFuture: boolean;
  score: number | null;
  hasAttendance: boolean;
}

interface ParticipantDetailSheetProps {
  eventId: string;
  participantId: string;
  participantName: string;
  isOpen: boolean;
  onClose: () => void;
}

function formatTime(date: Date): string {
  return new Date(date).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatDateShort(date: Date): string {
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function SessionRow({ session }: { session: SessionData }) {
  const isMeetingScore = session.score ? session.score >= 80 : false;

  return (
    <div className="flex items-start justify-between gap-4 p-3 bg-background border border-border rounded-lg">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <Clock className="w-4 h-4 text-primary shrink-0" />
          <p className="font-semibold text-foreground text-sm">
            {formatTime(session.startTime)} - {formatTime(session.endTime)}
          </p>
        </div>
        <p className="text-xs text-text-secondary">
          {formatDateShort(session.startTime)} • {session.durationMinutes} min
        </p>

        {session.isPast && session.hasAttendance && (
          <div className="mt-2 flex items-center gap-2">
            <div
              className={`flex items-center gap-1 text-xs font-semibold ${
                isMeetingScore
                  ? "text-primary"
                  : "text-orange-600 dark:text-orange-400"
              }`}
            >
              {isMeetingScore ? (
                <CheckCircle className="w-3.5 h-3.5" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5" />
              )}
              Score: {Math.round(session.score ?? 0)}%
            </div>
          </div>
        )}

        {session.isPast && !session.hasAttendance && (
          <div className="mt-2 flex items-center gap-2 text-xs text-text-secondary">
            <AlertCircle className="w-3.5 h-3.5" />
            No attendance record
          </div>
        )}

        {session.isFuture && (
          <div className="mt-2 flex items-center gap-2 text-xs text-text-secondary">
            <Clock className="w-3.5 h-3.5" />
            Upcoming session
          </div>
        )}
      </div>
    </div>
  );
}

export function ParticipantDetailSheet({
  eventId,
  participantId,
  participantName,
  isOpen,
  onClose,
}: ParticipantDetailSheetProps) {
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const fetchSessions = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await getEventSessionsForUserAction(
          eventId,
          participantId
        );
        if (!result.success) {
          setError(result.error || "Failed to fetch sessions");
          return;
        }

        const sessionsWithDates = (result.data || []).map((session: any) => ({
          ...session,
          startTime: new Date(session.startTime),
          endTime: new Date(session.endTime),
          date: new Date(session.date),
        }));

        setSessions(sessionsWithDates);
      } catch {
        setError("An error occurred while loading sessions");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSessions();
  }, [isOpen, eventId, participantId]);

  if (!isOpen) return null;

  const upcomingSessions = sessions.filter((s) => s.isFuture);
  const pastSessions = sessions.filter((s) => s.isPast);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-card border-l border-border shadow-lg z-50 overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-sm text-text-secondary">Viewing attendance for</p>
            <h2 className="text-lg font-bold text-foreground truncate">
              {participantName}
            </h2>
          </div>
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="shrink-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 rounded-lg" />
              ))}
            </div>
          ) : error ? (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 rounded-lg p-4 text-center">
              <p className="text-red-700 dark:text-red-400 text-sm font-medium">
                {error}
              </p>
            </div>
          ) : (
            <>
              {/* Past Sessions */}
              {pastSessions.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-primary uppercase tracking-wide mb-3">
                    Past Sessions ({pastSessions.length})
                  </h3>
                  <div className="space-y-2">
                    {pastSessions.map((session) => (
                      <SessionRow key={session.id} session={session} />
                    ))}
                  </div>
                </div>
              )}

              {/* Upcoming Sessions */}
              {upcomingSessions.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-primary uppercase tracking-wide mb-3">
                    Upcoming Sessions ({upcomingSessions.length})
                  </h3>
                  <div className="space-y-2">
                    {upcomingSessions.map((session) => (
                      <SessionRow key={session.id} session={session} />
                    ))}
                  </div>
                </div>
              )}

              {sessions.length === 0 && (
                <div className="text-center py-8 px-4">
                  <Clock className="w-8 h-8 text-text-secondary/50 mx-auto mb-3" />
                  <p className="text-sm text-text-secondary">
                    No sessions found
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
