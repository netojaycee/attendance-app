"use client";

import { useEffect, useState } from "react";
import { X, Clock, CheckCircle, AlertCircle, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getEventSessionsForUserAction } from "@/lib/actions/events.actions";
import { submitAttendanceForUserAction } from "@/lib/actions/attendance.actions";

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
  arrivalTime?: string;
}

interface ParticipantDetailSheetProps {
  eventId: string;
  participantId: string;
  participantName: string;
  isOpen: boolean;
  onClose: () => void;
  userRole?: string;
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

function SessionRow({
  session,
  canEdit,
  participantId,
  onAttendanceUpdated,
}: {
  session: SessionData;
  canEdit: boolean;
  participantId: string;
  onAttendanceUpdated: () => void;
}) {
  const isMeetingScore = session.score ? session.score >= 80 : false;
  const [isEditing, setIsEditing] = useState(false);
  const [arrivalTime, setArrivalTime] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleEdit = () => {
    if (session.hasAttendance && session.arrivalTime) {
      // Pre-fill with existing arrival time
      const arrivalDate = new Date(session.arrivalTime);
      const hours = String(arrivalDate.getHours()).padStart(2, "0");
      const minutes = String(arrivalDate.getMinutes()).padStart(2, "0");
      setArrivalTime(`${hours}:${minutes}`);
    } else {
      setArrivalTime("");
    }
    setIsEditing(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!arrivalTime) {
      setError("Please enter an arrival time");
      return;
    }

    setIsSubmitting(true);
    setError("");
    try {
      const arrivalDate = new Date(session.startTime);
      const [hours, minutes] = arrivalTime.split(":");
      arrivalDate.setHours(parseInt(hours), parseInt(minutes));

      const result = await submitAttendanceForUserAction(
        participantId,
        session.id,
        arrivalDate.toISOString(),
      );
      if (result.success) {
        setIsEditing(false);
        setArrivalTime("");
        onAttendanceUpdated();
      } else {
        setError(result.error || "Failed to update attendance");
      }
    } catch (err) {
      console.error("Error updating attendance:", err);
      setError("Error updating attendance");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-start justify-between gap-4 p-3 bg-background border border-border rounded-lg">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground mb-3">
            Update Arrival Time
          </p>
          <form onSubmit={handleSubmit} className="space-y-2">
            <div className="flex gap-2">
              <Input
                type="time"
                value={arrivalTime}
                onChange={(e) => setArrivalTime(e.target.value)}
                className="w-24 h-9 text-sm"
                disabled={isSubmitting}
              />
              <Button
                type="submit"
                size="sm"
                className="h-9 bg-primary hover:bg-primary/90"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Saving..." : "Save"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9"
                onClick={() => {
                  setIsEditing(false);
                  setArrivalTime("");
                  setError("");
                }}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            </div>
            {error && <p className="text-xs text-red-600">{error}</p>}
          </form>
        </div>
      </div>
    );
  }

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

      {canEdit && (session.isPast || session.isCurrent) && session.hasAttendance && (
        <Button
          onClick={handleEdit}
          variant="ghost"
          size="sm"
          className="shrink-0 text-primary hover:bg-primary/10"
        >
          <Edit2 className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
}

export function ParticipantDetailSheet({
  eventId,
  participantId,
  participantName,
  isOpen,
  onClose,
  userRole,
}: ParticipantDetailSheetProps) {
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshCount, setRefreshCount] = useState(0);

  // Determine if user can edit (all roles except members)
  const canEdit =
    userRole && ["PART_LEADER", "DISTRICT_LEADER", "ADMIN"].includes(userRole);

  useEffect(() => {
    if (!isOpen) return;

    const fetchSessions = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await getEventSessionsForUserAction(
          eventId,
          participantId,
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
  }, [isOpen, eventId, participantId, refreshCount]);

  if (!isOpen) return null;

  const upcomingSessions = sessions.filter((s) => s.isFuture);
  const pastAndCurrentSessions = sessions
    .filter((s) => s.isPast || s.isCurrent)
    .sort((a, b) => {
      // Current sessions first, then past sessions sorted by start time descending
      if (a.isCurrent && !b.isCurrent) return -1;
      if (!a.isCurrent && b.isCurrent) return 1;
      return new Date(b.startTime).getTime() - new Date(a.startTime).getTime();
    });

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
            <p className="text-sm text-text-secondary">
              Viewing attendance for
            </p>
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
              <Tabs defaultValue="past" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-muted">
                  <TabsTrigger value="past" className="relative">
                    Past
                    {pastAndCurrentSessions.length > 0 && (
                      <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-xs font-semibold bg-border text-text-secondary rounded-full">
                        {pastAndCurrentSessions.length}
                      </span>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="upcoming" className="relative">
                    Upcoming
                    {upcomingSessions.length > 0 && (
                      <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-xs font-semibold bg-primary text-foreground rounded-full">
                        {upcomingSessions.length}
                      </span>
                    )}
                  </TabsTrigger>
                </TabsList>

                {/* Past Sessions Tab */}
                <TabsContent value="past" className="mt-4 space-y-2">
                  {pastAndCurrentSessions.length > 0 ? (
                    <div className="space-y-2">
                      {pastAndCurrentSessions.map((session) => (
                        <SessionRow
                          key={session.id}
                          session={session}
                          canEdit={canEdit as any}
                          participantId={participantId}
                          onAttendanceUpdated={() =>
                            setRefreshCount((c) => c + 1)
                          }
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 px-4">
                      <Clock className="w-8 h-8 text-text-secondary/50 mx-auto mb-3" />
                      <p className="text-sm text-text-secondary">
                        No past sessions
                      </p>
                    </div>
                  )}
                </TabsContent>

                {/* Upcoming Sessions Tab */}
                <TabsContent value="upcoming" className="mt-4 space-y-2">
                  {upcomingSessions.length > 0 ? (
                    <div className="space-y-2">
                      {upcomingSessions.map((session) => (
                        <SessionRow
                          key={session.id}
                          session={session}
                          canEdit={false}
                          participantId={participantId}
                          onAttendanceUpdated={() =>
                            setRefreshCount((c) => c + 1)
                          }
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 px-4">
                      <Clock className="w-8 h-8 text-text-secondary/50 mx-auto mb-3" />
                      <p className="text-sm text-text-secondary">
                        No upcoming sessions
                      </p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </>
          )}
        </div>
      </div>
    </>
  );
}
