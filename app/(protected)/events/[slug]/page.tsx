"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { submitAttendanceAction } from "@/lib/actions/attendance.actions";
import { getEventSessionsWithAttendanceAction } from "@/lib/actions/sessions.actions";
import {
  getEventByIdentifierAction,
  getEventParticipantsAction,
} from "@/lib/actions/events.actions";
import { useAuthStore } from "@/lib/stores/auth-store";
import { EventParticipantsTable } from "@/components/local/event-participants-table";
import { ParticipantDetailSheet } from "@/components/local/participant-detail-sheet";
import { VoicePart } from "@/prisma/generated/enums";

interface SessionData {
  id: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  date: Date;
  isPast: boolean;
  isCurrent: boolean;
  isFuture: boolean;
  score: number | null;
  hasAttendance: boolean;
}

interface EventData {
  id: string;
  title: string;
  passMark: number;
}

export interface Participant {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  voicePart: VoicePart;
  instrument: string | null;
  score: number;
  isMeetingTarget: boolean;
}

function formatTime(date: string): string {
  return new Date(date).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatDateShort(date: string): string {
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

interface SessionItemProps {
  session: SessionData;
  eventId: string;
  onAttendanceSubmitted?: () => void;
}

function SessionItem({
  session,
  eventId,
  onAttendanceSubmitted,
}: SessionItemProps) {
  console.log(eventId);
  const [arrivalTime, setArrivalTime] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(session.hasAttendance);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!arrivalTime) {
      setError("Please enter an arrival time");
      return;
    }

    setIsSubmitting(true);
    setError("");
    try {
      const result = await submitAttendanceAction(session.id, arrivalTime);
      if (result.success) {
        setSubmitted(true);
        setArrivalTime("");
        onAttendanceSubmitted?.();
      } else {
        setError(result.error || "Failed to submit attendance");
      }
    } catch (err) {
      console.error("Error submitting attendance:", err);
      setError("Error submitting attendance");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isMeetingScore = session.score ? session.score >= 80 : false;

  return (
    <div className="flex items-start justify-between gap-4 p-3 bg-card border border-border rounded-lg hover:border-primary/50 transition-colors">
      {/* Time and Date */}
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

        {/* Score or Status */}
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

        {session.isCurrent && submitted && session.score !== null && (
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
              Score: {Math.round(session.score)}%
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

      {/* Submission Form */}
      {session.isCurrent && !submitted && (
        <form
          onSubmit={handleSubmit}
          className="flex gap-2 shrink-0 items-start"
        >
          <div className="flex flex-col gap-1">
            <Input
              type="time"
              value={arrivalTime}
              onChange={(e) => setArrivalTime(e.target.value)}
              className="w-20 h-9 text-sm"
              disabled={isSubmitting}
            />
            {error && <p className="text-xs text-red-600">{error}</p>}
          </div>
          <Button
            type="submit"
            size="sm"
            className="h-9 bg-primary hover:bg-primary/90"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Loader className="w-3.5 h-3.5 animate-spin" />
            ) : (
              "Mark"
            )}
          </Button>
        </form>
      )}

      {(submitted || (session.isCurrent && session.hasAttendance)) && (
        <div className="flex gap-2 items-center text-xs font-semibold text-primary shrink-0 bg-primary/10 px-2 py-1.5 rounded">
          <CheckCircle className="w-3.5 h-3.5" />
          Marked
        </div>
      )}
    </div>
  );
}

export default function EventDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const router = useRouter();
  const { user } = useAuthStore();

  // Determine if user is viewing their own data or others
  const isViewingOthers =
    user?.role &&
    ["PART_LEADER", "DISTRICT_LEADER", "ADMIN"].includes(user.role);

  // States for own view
  const [event, setEvent] = useState<EventData | null>(null);
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshCount, setRefreshCount] = useState(0);

  // States for participants view
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isLoadingParticipants, setIsLoadingParticipants] = useState(false);
  const [selectedParticipantId, setSelectedParticipantId] = useState<
    string | null
  >(null);
  const [selectedParticipantName, setSelectedParticipantName] =
    useState<string>("");

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Fetch event details
        const eventResult = await getEventByIdentifierAction(slug);
        if (!eventResult.success || !eventResult.data) {
          setError("Event not found");
          return;
        }

        console.log("Fetched event details:", eventResult.data);
        setEvent(eventResult.data as any);

        // If user is a leader/admin, fetch participants instead
        if (isViewingOthers) {
          setIsLoadingParticipants(true);
          const participantsResult = await getEventParticipantsAction(slug);
          if (participantsResult.success) {
            setParticipants(participantsResult.data || []);
          }
          setIsLoadingParticipants(false);
        } else {
          // Fetch sessions for this member
          const sessionsResult =
            await getEventSessionsWithAttendanceAction(slug);
          if (!sessionsResult.success) {
            setError("Failed to fetch sessions");
            return;
          }
          console.log("Fetched sessions with attendance:", sessionsResult.data);

          // Convert dates to Date objects
          const sessionsWithDates = (sessionsResult.data || []).map(
            (session: any) => ({
              ...session,
              startTime: new Date(session.startTime),
              endTime: new Date(session.endTime),
              date: new Date(session.date),
            }),
          );

          setSessions(sessionsWithDates);
        }
      } catch (err) {
        console.error("Error loading event details:", err);
        setError("An error occurred while loading event details");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [slug, refreshCount, isViewingOthers]);

  const handleViewParticipant = (
    participantId: string,
    participantName: string,
  ) => {
    setSelectedParticipantId(participantId);
    setSelectedParticipantName(participantName);
  };

  const handleCloseDetail = () => {
    setSelectedParticipantId(null);
    setSelectedParticipantName("");
  };

  const upcomingSessions = sessions.filter((s) => s.isFuture);
  const pastSessions = sessions.filter((s) => s.isPast);
  const currentSessions = sessions.filter((s) => s.isCurrent);

  return (
    <div className="min-h-screen bg-linear-to-b from-background to-card/30 pb-24">
      {/* Back Button */}
      <div className="sticky top-0 z-20 bg-card/80 backdrop-blur-sm border-b border-border px-6 py-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-text-secondary hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back</span>
        </button>
      </div>

      {/* Error State */}
      {error && (
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 rounded-lg p-4 text-center">
            <p className="text-red-700 dark:text-red-400 text-sm font-medium">
              {error}
            </p>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="max-w-4xl mx-auto px-6 py-8">
          <Skeleton className="h-12 mb-6 rounded-lg" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 rounded-lg" />
            ))}
          </div>
        </div>
      )}

      {/* Event Details */}
      {!isLoading && event && (
        <div className="max-w-4xl mx-auto px-6 py-6">
          {/* Event Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-foreground mb-2">
              {event.title}
            </h1>
            <p className="text-sm text-text-secondary">
              {isViewingOthers
                ? `Viewing attendance for ${participants.length} participants`
                : `Target attendance: ${event.passMark}%`}
            </p>
          </div>

          {/* MEMBERS VIEW - Own Sessions */}
          {!isViewingOthers && (
            <>
              {/* Current Sessions - Priority Display */}
              {currentSessions.length > 0 && (
                <div className="mb-6 p-4 bg-primary/10 border border-primary/30 rounded-lg">
                  <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-3">
                    Currently Happening
                  </p>
                  <div className="space-y-2">
                    {currentSessions.map((session) => (
                      <SessionItem
                        key={session.id}
                        session={session}
                        eventId={event.id}
                        onAttendanceSubmitted={() =>
                          setRefreshCount((c) => c + 1)
                        }
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Sessions Tabs */}
              <Tabs defaultValue="upcoming" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-card border border-border">
                  <TabsTrigger value="upcoming" className="relative">
                    Upcoming
                    {upcomingSessions.length > 0 && (
                      <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-xs font-semibold bg-primary text-foreground rounded-full">
                        {upcomingSessions.length}
                      </span>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="past" className="relative">
                    Past
                    {pastSessions.length > 0 && (
                      <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-xs font-semibold bg-border text-text-secondary rounded-full">
                        {pastSessions.length}
                      </span>
                    )}
                  </TabsTrigger>
                </TabsList>

                {/* Upcoming Sessions Tab */}
                <TabsContent value="upcoming" className="mt-4 space-y-2">
                  {upcomingSessions.length > 0 ? (
                    upcomingSessions.map((session) => (
                      <SessionItem
                        key={session.id}
                        session={session}
                        eventId={event.id}
                      />
                    ))
                  ) : (
                    <div className="text-center py-8 px-4">
                      <Clock className="w-8 h-8 text-text-secondary/50 mx-auto mb-3" />
                      <p className="text-sm text-text-secondary">
                        No upcoming sessions
                      </p>
                    </div>
                  )}
                </TabsContent>

                {/* Past Sessions Tab */}
                <TabsContent value="past" className="mt-4 space-y-2">
                  {pastSessions.length > 0 ? (
                    pastSessions.map((session) => (
                      <SessionItem
                        key={session.id}
                        session={session}
                        eventId={event.id}
                      />
                    ))
                  ) : (
                    <div className="text-center py-8 px-4">
                      <AlertCircle className="w-8 h-8 text-text-secondary/50 mx-auto mb-3" />
                      <p className="text-sm text-text-secondary">
                        No past sessions
                      </p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </>
          )}

          {/* LEADERS/ADMIN VIEW - Participants Table */}
          {isViewingOthers && (
            <EventParticipantsTable
              participants={participants}
              isLoading={isLoadingParticipants}
              passMark={event.passMark}
              onViewParticipant={handleViewParticipant}
              currentUserId={user?.id}
            />
          )}
        </div>
      )}

      {/* Participant Detail Sheet */}
      {event && selectedParticipantId && (
        <ParticipantDetailSheet
          eventId={event.id}
          participantId={selectedParticipantId}
          participantName={selectedParticipantName}
          isOpen={!!selectedParticipantId}
          onClose={handleCloseDetail}
          userRole={user?.role}
        />
      )}
    </div>
  );
}
