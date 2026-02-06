"use client";

import { useState, useMemo } from "react";
import { Search, BarChart3, Plus, Download, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";

interface EventStat {
  id: string;
  title: string;
  date: string;
  status: "completed" | "active" | "upcoming";
  avgScore: number;
  participantCount: number;
}

// Mock data - replace with actual server action
const mockEvents: EventStat[] = [
  {
    id: "1",
    title: "Spring Concert Rehearsal",
    date: "March 12, 2024",
    status: "completed",
    avgScore: 8.5,
    participantCount: 45,
  },
  {
    id: "2",
    title: "Youth Choir Sunday",
    date: "March 15, 2024",
    status: "active",
    avgScore: 9.2,
    participantCount: 32,
  },
  {
    id: "3",
    title: "Community Outreach Prep",
    date: "March 08, 2024",
    status: "completed",
    avgScore: 7.8,
    participantCount: 58,
  },
  {
    id: "4",
    title: "Evening Vesper Service",
    date: "March 20, 2024",
    status: "upcoming",
    avgScore: 0,
    participantCount: 0,
  },
];

function getStatusColor(
  status: "completed" | "active" | "upcoming"
): string {
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
                event.status
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
          >
            View Users
          </Button>
          <Button
            size="sm"
            className="bg-primary hover:bg-primary/90 text-slate-900 text-xs h-7 px-3 font-bold"
          >
            View Analytics
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function StatsPage() {
  const [searchQuery, setSearchQuery] = useState("");

  // Calculate stats
  const stats = useMemo(() => {
    const activeCount = mockEvents.filter((e) => e.status === "active").length;
    const avgScore =
      mockEvents.length > 0
        ? (
            mockEvents.reduce((sum, e) => sum + e.avgScore, 0) / mockEvents.length
          ).toFixed(1)
        : 0;
    const totalParticipants = mockEvents.reduce((sum, e) => sum + e.participantCount, 0);

    return { activeCount, avgScore, totalParticipants };
  }, []);

  // Filter events based on search
  const filteredEvents = useMemo(() => {
    return mockEvents.filter((event) =>
      event.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  return (
    <div className="pb-24">
      {/* Header with Tabs */}
      <div className="sticky top-0 z-10 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
        <div className="px-4 py-3 flex items-center justify-between mb-2">
          <h1 className="text-lg font-bold text-slate-900 dark:text-white">
            Analytics Summary
          </h1>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <BarChart3 className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </Button>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="events" className="w-full">
          <TabsList className="w-full justify-start bg-transparent border-b border-slate-200 dark:border-slate-700 rounded-none h-auto p-0">
            <TabsTrigger
              value="overview"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent text-slate-600 dark:text-slate-400 data-[state=active]:text-slate-900 dark:data-[state=active]:text-white px-4 py-3"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="events"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent text-slate-600 dark:text-slate-400 data-[state=active]:text-slate-900 dark:data-[state=active]:text-white px-4 py-3"
            >
              Events
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="p-4">
            <div className="text-center py-12 text-slate-500 dark:text-slate-400">
              <p className="text-sm">Overview analytics coming soon...</p>
            </div>
          </TabsContent>

          {/* Events Tab */}
          <TabsContent value="events" className="m-0">
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
                <Card className="flex flex-col items-center gap-1 p-3 min-w-[100px] border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                  <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                    Active
                  </span>
                  <span className="text-lg font-bold text-slate-900 dark:text-white">
                    {stats.activeCount}
                  </span>
                </Card>
                <Card className="flex flex-col items-center gap-1 p-3 min-w-[100px] border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                  <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                    Avg Score
                  </span>
                  <span className="text-lg font-bold text-slate-900 dark:text-white">
                    {stats.avgScore}
                  </span>
                </Card>
                <Card className="flex flex-col items-center gap-1 p-3 min-w-[100px] border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
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
            {filteredEvents.length > 0 ? (
              <div className="divide-y divide-slate-200 dark:divide-slate-700">
                {filteredEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            ) : (
              <div className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                <p className="text-sm">No events found</p>
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

                <button className="flex flex-col items-center gap-2 py-2.5 text-center">
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
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
