"use client";

import { useSearchParams } from "next/navigation";
import { AttendanceSubNavigation } from "@/components/local/attendance-sub-navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AttendancePage() {
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab") || "events";

  return (
    <div>
      <AttendanceSubNavigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentTab === "events" && (
          <Card>
            <CardHeader>
              <CardTitle>Attendance Events</CardTitle>
              <CardDescription>
                View and manage attendance for different events
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 dark:text-slate-400">
                Events content will be displayed here
              </p>
            </CardContent>
          </Card>
        )}

        {currentTab === "users" && (
          <Card>
            <CardHeader>
              <CardTitle>Attendance by Users</CardTitle>
              <CardDescription>
                View attendance records organized by users
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 dark:text-slate-400">
                Users content will be displayed here
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
