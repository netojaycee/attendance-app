"use client";

import { BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EventsStatsTab } from "@/components/local/events-stats-tab";

export default function StatsPage() {
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
            <EventsStatsTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
