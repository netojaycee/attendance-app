"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, BarChart3, Plus, Download, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getEventsWithStatsAction } from "@/lib/actions/events.actions";

interface EventStat {
  id: string;
  title: string;
  date: string;
  status: "completed" | "active" | "upcoming";
  avgScore: number;
  participantCount: number;
}

function getStatusColor(status: "completed" | "active" | "upcoming"): string {
  switch (status) {
    case "completed":
      return "bg-primary/20 dark:bg-primary/10 text-slate-900 dark:text-primary";
    case "active":
      return "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400";
    case "upcoming":
      return "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400";
  }
}

function EventCard({ event }: { event: EventStat }) {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-3 px-4 py-4 border-b border-slate-200 dark:border-slate-700">
      {/* Header Row */}
      <div className="flex justify-between items-start">
        <div className="flex flex-col flex-1">
          <p className="text-base font-bold text-slate-900 dark:text-white">
            {event.title}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${getStatusColor(
                event.status,
              )}`}
            >
              {event.status}
            </span>
            <p className="text-slate-600 dark:text-slate-400 text-xs font-normal">
              {event.date}
            </p>
          </div>
        </div>

        {/* Score Box */}
        <div className="bg-slate-100 dark:bg-slate-700/50 px-2 py-1 rounded text-right">
          <p className="text-slate-900 dark:text-white text-sm font-bold">
            {event.avgScore > 0 ? event.avgScore : "—"}
          </p>
          <p className="text-slate-600 dark:text-slate-400 text-[10px]">
            Avg Score
          </p>
        </div>
      </div>

      {/* Footer Row */}
      <div className="flex items-center justify-between">
        <p className="text-slate-600 dark:text-slate-400 text-sm font-normal">
          <span className="font-medium text-slate-900 dark:text-white">
            {event.participantCount}
          </span>{" "}
          Participants
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="text-xs h-7 px-3 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/30"
            onClick={() =>
              router.push(`/stats/events/${event.id}/participants`)
            }
          >
            View Users
          </Button>
          {/* <Button
            size="sm"
            className="bg-primary hover:bg-primary/90 text-slate-900 text-xs h-7 px-3 font-bold"
          >
            View Analytics
          </Button> */}
        </div>
      </div>
    </div>
  );
}

export function EventsStatsTab() {
  const router = useRouter();
  const [events, setEvents] = useState<EventStat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchEvents = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await getEventsWithStatsAction();
        if (result.success) {
          setEvents(result.data || []);
        } else {
          setError(result.error || "Failed to load events");
        }
      } catch (err) {
        console.log(err);
        setError("An error occurred while loading events");
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
  }, []);

  // Calculate stats
  const stats = useMemo(() => {
    const activeCount = events.filter((e) => e.status === "active").length;
    const avgScore =
      events.length > 0
        ? (
            events.reduce((sum, e) => sum + e.avgScore, 0) / events.length
          ).toFixed(1)
        : 0;
    const totalParticipants = events.reduce(
      (sum, e) => sum + e.participantCount,
      0,
    );

    return { activeCount, avgScore, totalParticipants };
  }, [events]);

  // Filter events based on search
  const filteredEvents = useMemo(() => {
    return events.filter((event) =>
      event.title.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [searchQuery, events]);

  if (error) {
    return (
      <div className="px-4 py-8 text-center">
        <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <>
      {/* Search Bar */}
      <div className="px-4 py-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input
            type="text"
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-slate-100 dark:bg-slate-700/50 border-0 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Quick Stats */}
      <div className="px-4 pb-3">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <Card className="flex flex-col items-center gap-1 p-3 min-w-25 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
              Active
            </span>
            <span className="text-lg font-bold text-slate-900 dark:text-white">
              {stats.activeCount}
            </span>
          </Card>
          <Card className="flex flex-col items-center gap-1 p-3 min-w-25 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
              Avg Score
            </span>
            <span className="text-lg font-bold text-slate-900 dark:text-white">
              {stats.avgScore}
            </span>
          </Card>
          <Card className="flex flex-col items-center gap-1 p-3 min-w-25 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
              Participants
            </span>
            <span className="text-lg font-bold text-slate-900 dark:text-white">
              {stats.totalParticipants}
            </span>
          </Card>
        </div>
      </div>

      {/* Events List */}
      {isLoading ? (
        <div className="divide-y divide-slate-200 dark:divide-slate-700">
          {[1, 2, 3].map((i) => (
            <div key={i} className="px-4 py-4 space-y-3">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-1/3" />
            </div>
          ))}
        </div>
      ) : filteredEvents.length > 0 ? (
        <div className="divide-y divide-slate-200 dark:divide-slate-700">
          {filteredEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      ) : (
        <div className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
          <p className="text-sm">
            {searchQuery
              ? "No events found matching your search"
              : "No events found"}
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="px-4 py-6 mt-4 border-t border-slate-200 dark:border-slate-700">
        <div className="grid grid-cols-4 gap-3">
          <button className="flex flex-col items-center gap-2 py-2.5 text-center">
            <div className="rounded-full bg-slate-100 dark:bg-slate-700/50 p-2.5">
              <BarChart3 className="w-5 h-5 text-slate-900 dark:text-white" />
            </div>
            <p className="text-slate-900 dark:text-white text-[10px] font-medium leading-normal">
              Analytics
            </p>
          </button>

          <button
            onClick={() => router.push("/events/create")}
            className="flex flex-col items-center gap-2 py-2.5 text-center"
          >
            <div className="rounded-full bg-primary p-2.5">
              <Plus className="w-5 h-5 text-slate-900" />
            </div>
            <p className="text-slate-900 dark:text-white text-[10px] font-medium leading-normal">
              New Event
            </p>
          </button>

          <button className="flex flex-col items-center gap-2 py-2.5 text-center">
            <div className="rounded-full bg-slate-100 dark:bg-slate-700/50 p-2.5">
              <Download className="w-5 h-5 text-slate-900 dark:text-white" />
            </div>
            <p className="text-slate-900 dark:text-white text-[10px] font-medium leading-normal">
              Export Data
            </p>
          </button>

          <button className="flex flex-col items-center gap-2 py-2.5 text-center">
            <div className="rounded-full bg-slate-100 dark:bg-slate-700/50 p-2.5">
              <Users className="w-5 h-5 text-slate-900 dark:text-white" />
            </div>
            <p className="text-slate-900 dark:text-white text-[10px] font-medium leading-normal">
              Member List
            </p>
          </button>
        </div>
      </div>
    </>
  );
}
