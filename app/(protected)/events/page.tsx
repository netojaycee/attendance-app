"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { getUserEventsWithProgressAction } from "@/lib/actions/events.actions";
import { Calendar } from "lucide-react";

type FilterType = "all" | "upcoming" | "past";

interface EventItem {
  id: string;
  title: string;
  description: string | null;
  score: number;
  startDate: Date;
  endDate: Date | null;
  passMark: number;
  slug?: string;
  // isRequired: boolean;
}

function formatDateRange(startDate: Date, endDate: Date | null): string {
  const start = new Date(startDate);
  const startMonth = start.toLocaleString("default", { month: "short" });
  const startDay = start.getDate();

  if (!endDate) {
    return `From ${startMonth} ${startDay}`;
  }

  const end = new Date(endDate);
  const endMonth = end.toLocaleString("default", { month: "short" });
  const endDay = end.getDate();

  // Always show both months for clarity: "Feb 10 - Feb 20" or "Feb 10 - May 20"
  return `${startMonth} ${startDay} - ${endMonth} ${endDay}`;
}

function getScoreColor(score: number, passMark: number): string {
  if (score >= passMark) {
    return "text-primary dark:text-primary font-bold";
  }
  if (score >= passMark - 10) {
    return "text-orange-600 dark:text-orange-400 font-medium";
  }
  return "text-red-600 dark:text-red-400 font-medium";
}

function filterEvents(events: EventItem[], filter: FilterType): EventItem[] {
  const now = new Date();

  switch (filter) {
    case "upcoming":
      return events.filter((e) => e.startDate > now);
    case "past":
      return events.filter((e) => e.startDate <= now);
    // case "required":
    //   return events.filter((e) => e.isRequired);
    default:
      return events;
  }
}

function EventListItem({ event }: { event: EventItem }) {
  const router = useRouter();


  const scoreColor = getScoreColor(event.score, event.passMark);
  const isMeetingTarget = event.score >= event.passMark;

  return (
    <div
      onClick={() => router.push(`/events/${event.slug}`)}
      className="flex items-start gap-4 px-4 py-4 border-b border-border hover:bg-card/50 dark:hover:bg-slate-700/20 transition-colors cursor-pointer group"
    >
      <div className="flex-1 min-w-0">
        <p className="text-base font-semibold text-foreground truncate group-hover:text-primary transition-colors">
          {event.title}
        </p>
        {event.description && (
          <p className="text-xs text-text-secondary truncate mt-1">
            {event.description}
          </p>
        )}
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <span className={`text-sm ${scoreColor} flex items-center gap-1`}>
            {isMeetingTarget ? "✓" : "⏱"} Score: {event.score}%
          </span>
          <span className="w-1 h-1 bg-border rounded-full"></span>
          <span className="text-xs text-text-secondary">
            Target: {event.passMark}%
          </span>
          <span className="w-1 h-1 bg-border rounded-full"></span>
          <span className="text-xs text-text-secondary">
            {formatDateRange(event.startDate, event.endDate)}
          </span>
        </div>
      </div>
      <Button
        onClick={(e) => {
          e.stopPropagation();
          router.push(`/events/${event.slug}`);
        }}
        variant="outline"
        size="sm"
        className="shrink-0 bg-primary text-foreground border-0 hover:bg-primary/90 font-semibold"
      >
        Details
      </Button>
    </div>
  );
}

export default function EventsPage() {
  const [filter, setFilter] = useState<FilterType>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await getUserEventsWithProgressAction();
        if (result.success && result.data) {
          // Convert dates to Date objects
          const eventsWithDates = result.data.map((event: any) => ({
            ...event,
            startDate: new Date(event.startDate),
            endDate: event.endDate ? new Date(event.endDate) : null,
          }));
          // console.log("Fetched events with dates:", eventsWithDates);
          setEvents(eventsWithDates);
        } else {
          setError(result.error || "Failed to fetch events");
        }
      } catch {
        setError("An error occurred while fetching events");
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const filteredEvents = filterEvents(events, filter);

  return (
    <div className="min-h-screen bg-linear-to-b from-background to-card/30">
      {/* Header Section with Background */}
      <div className="bg-linear-to-r from-primary/10 to-primary/5 border-b border-border p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="w-6 h-6 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Events</h1>
          </div>
          <p className="text-text-secondary">
            Manage and track your attendance across all events
          </p>
        </div>
      </div>

      {/* Filter Section */}
      <div className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex justify-end">
          <Select
            value={filter}
            onValueChange={(value) => setFilter(value as FilterType)}
          >
            <SelectTrigger className="w-40 bg-background border-border text-foreground">
              <SelectValue placeholder="Filter events" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem
                value="all"
                className="text-foreground cursor-pointer hover:bg-primary/10"
              >
                All Events
              </SelectItem>
              <SelectItem
                value="upcoming"
                className="text-foreground cursor-pointer hover:bg-primary/10"
              >
                Upcoming
              </SelectItem>
              <SelectItem
                value="past"
                className="text-foreground cursor-pointer hover:bg-primary/10"
              >
                Past
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-4xl mx-auto">
        {isLoading ? (
          <div className="px-6 py-8 space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 rounded-lg" />
            ))}
          </div>
        ) : error ? (
          <div className="px-6 py-12 text-center">
            <p className="text-red-600 dark:text-red-400 font-medium">
              {error}
            </p>
          </div>
        ) : filteredEvents.length > 0 ? (
          <div className="divide-y divide-border bg-card rounded-lg shadow-sm m-6 overflow-hidden">
            {filteredEvents.map((event) => (
              <EventListItem key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <div className="px-6 py-16 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
              <Calendar className="w-8 h-8 text-primary" />
            </div>
            <p className="text-lg font-semibold text-foreground mb-2">
              No Events Found
            </p>
            <p className="text-text-secondary">
              {filter === "all"
                ? "There are no events available at the moment."
                : `There are no ${filter} events at the moment.`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
