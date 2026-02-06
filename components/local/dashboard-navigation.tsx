"use client";

import { useRouter, usePathname } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LayoutDashboard,
  Calendar,
  CheckSquare,
  Settings,
  Users,
} from "lucide-react";

const navigationItems = [
  { value: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { value: "events", label: "Events", icon: Calendar },
  { value: "attendance", label: "Attendance", icon: CheckSquare },
  { value: "users", label: "Users", icon: Users },
  { value: "settings", label: "Settings", icon: Settings },
];

export function DashboardNavigation() {
  const router = useRouter();
  const pathname = usePathname();

  // Extract the current tab from pathname
  const currentTab = navigationItems.find((item) =>
    pathname.includes(`/${item.value}`)
  )?.value || "dashboard";

  const handleTabChange = (value: string) => {
    if (value === "dashboard") {
      router.push("/dashboard");
    } else {
      router.push(`/${value}`);
    }
  };

  return (
    <div className="border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 backdrop-blur supports-[backdrop-filter]:dark:bg-slate-900/40 supports-[backdrop-filter]:bg-white/40 sticky top-16 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Tabs
          value={currentTab}
          onValueChange={handleTabChange}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-5 bg-transparent border-b border-slate-200 dark:border-slate-700 rounded-none gap-0 p-0 h-auto">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.value;

              return (
                <TabsTrigger
                  key={item.value}
                  value={item.value}
                  className="relative px-2 sm:px-4 py-3 sm:py-4 rounded-none border-b-2 border-transparent data-[state=active]:border-b-2 data-[state=active]:border-[#833CF6] dark:data-[state=active]:border-[#10B981] data-[state=active]:bg-transparent text-slate-600 dark:text-slate-400 data-[state=active]:text-[#833CF6] dark:data-[state=active]:text-[#10B981] hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors font-medium text-xs sm:text-sm flex items-center gap-1 sm:gap-2"
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
