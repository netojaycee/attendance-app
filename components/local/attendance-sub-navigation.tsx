"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Users } from "lucide-react";

const subNavigationItems = [
  { value: "events", label: "Events", icon: Calendar },
  { value: "users", label: "Users", icon: Users },
];

export function AttendanceSubNavigation() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get current tab from query params, default to 'events'
  const currentTab = searchParams.get("tab") || "events";

  const handleTabChange = (value: string) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("tab", value);
    router.push(`/attendance?${newParams.toString()}`);
  };

  return (
    <div className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 backdrop-blur supports-[backdrop-filter]:bg-slate-50/40 dark:supports-[backdrop-filter]:bg-slate-800/30 sticky top-32 z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Tabs
          value={currentTab}
          onValueChange={handleTabChange}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2 bg-transparent border-b border-slate-200 dark:border-slate-600 rounded-none gap-0 p-0 h-auto max-w-xs">
            {subNavigationItems.map((item) => {
              const Icon = item.icon;

              return (
                <TabsTrigger
                  key={item.value}
                  value={item.value}
                  className="relative px-3 sm:px-6 py-2.5 sm:py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-b-2 data-[state=active]:border-[#833CF6] dark:data-[state=active]:border-[#10B981] data-[state=active]:bg-transparent text-slate-600 dark:text-slate-400 data-[state=active]:text-[#833CF6] dark:data-[state=active]:text-[#10B981] hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors font-medium text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2"
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="hidden sm:inline">{item.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>
        </Tabs>
      </div>
    </div>
  );
}
