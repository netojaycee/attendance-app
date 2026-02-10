"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getEventParticipantsAction } from "@/lib/actions/events.actions";

interface Participant {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  voicePart: string;
  instrument: string | null;
  score: number;
  isMeetingTarget: boolean;
}

export default function EventParticipantsPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.id as string;

  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchParticipants = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await getEventParticipantsAction(eventId);
        if (result.success) {
          setParticipants(result.data || []);
        } else {
          setError(result.error || "Failed to load participants");
        }
      } catch (err) {
        console.error(err)
        setError("An error occurred while loading participants");
      } finally {
        setIsLoading(false);
      }
    };

    fetchParticipants();
  }, [eventId]);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 px-4 py-3 flex items-center gap-3">
        <Button
          onClick={() => router.back()}
          variant="ghost"
          size="icon"
          className="h-8 w-8"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Event Participants
          </p>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white truncate">
            {participants.length > 0
              ? `${participants.length} Participants`
              : "Event Participants"}
          </h1>
        </div>
        <Users className="w-5 h-5 text-slate-600 dark:text-slate-400" />
      </div>

      {/* Content */}
      <div className="divide-y divide-slate-200 dark:divide-slate-700">
        {isLoading ? (
          <div className="space-y-3 p-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-16 rounded-lg" />
            ))}
          </div>
        ) : error ? (
          <div className="px-4 py-8 text-center">
            <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
          </div>
        ) : participants.length > 0 ? (
          participants.map((participant) => {
            const isGoodAttendance = participant.isMeetingTarget;
            const fullName = `${participant.firstName} ${participant.lastName}`;
            return (
              <div
                key={participant.id}
                className="px-4 py-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-base font-semibold text-slate-900 dark:text-white">
                    {fullName}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {participant.voicePart}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-500 mt-0.5">
                    {participant.email}
                  </p>
                </div>

                <div
                  className={`text-right ml-4 px-3 py-2 rounded-lg ${
                    isGoodAttendance
                      ? "bg-green-50 dark:bg-green-900/20"
                      : "bg-orange-50 dark:bg-orange-900/20"
                  }`}
                >
                  <p
                    className={`text-sm font-bold ${
                      isGoodAttendance
                        ? "text-green-700 dark:text-green-400"
                        : "text-orange-700 dark:text-orange-400"
                    }`}
                  >
                    {participant.score}%
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Attendance
                  </p>
                </div>
              </div>
            );
          })
        ) : (
          <div className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
            <p className="text-sm">No participants found</p>
          </div>
        )}
      </div>
    </div>
  );
}
