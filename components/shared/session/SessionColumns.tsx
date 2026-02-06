"use client";
import { useEffect, useState } from "react";
// import { Badge } from "@/components/ui/badge";
import SessionActions from "./SessionActions";
import { Column } from "@/components/custom/custom-table";
import { format } from "date-fns";

// Hook to detect if we're on mobile
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return isMobile;
}

// const getStatusColor = (status: string) => {
//   switch (status) {
//     case "scheduled":
//       return "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400";
//     case "completed":
//       return "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400";
//     case "cancelled":
//       return "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400";
//     default:
//       return "bg-slate-100 dark:bg-slate-900/30 text-slate-700 dark:text-slate-400";
//   }
// };

// Mobile columns (2 essential columns)
export const sessionColumnsMobile: Column<any>[] = [
  {
    key: "startTime",
    title: "Session",
    className: "text-xs",
    render: (value, row) => {
      const startDate = new Date(value);
      return (
        <div className="min-w-0">
          <div className="font-medium text-slate-900 dark:text-white line-clamp-1 text-xs">
            {format(startDate, "MMM dd")}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {format(startDate, "h:mm a")} - {format(new Date(row.endTime), "h:mm a")}
          </div>
        </div>
      );
    },
  },
  {
    key: "actions",
    title: "",
    className: "w-8 text-sm",
    render: (_, row) => <SessionActions session={row} />,
    searchable: false,
  },
];

// Desktop columns (all columns)
export const sessionColumnsDesktop: Column<any>[] = [
  {
    key: "startTime",
    title: "Session",
    className: "text-xs",
    render: (value, row) => {
      const startDate = new Date(value);
      return (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-linear-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-white font-semibold text-xs">
            {format(startDate, "d")}
          </div>
          <div>
            <div className="font-medium text-slate-900 dark:text-white line-clamp-1">
              {format(startDate, "MMM dd, yyyy")}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {format(startDate, "h:mm a")} - {format(new Date(row.endTime), "h:mm a")}
            </div>
          </div>
        </div>
      );
    },
  },
  {
    key: "durationMinutes",
    title: "Duration",
    className: "text-xs hidden md:table-cell",
    render: (value) => (
      <span className="text-slate-700 dark:text-slate-300">
        {value} min
      </span>
    ),
  },
//   {
//     key: "status",
//     title: "Status",
//     className: "text-xs hidden lg:table-cell",
//     render: (value) => (
//       <Badge className={`text-xs capitalize ${getStatusColor(value)}`}>
//         {value}
//       </Badge>
//     ),
//   },
  {
    key: "attendanceCount",
    title: "Attendees",
    className: "text-xs hidden lg:table-cell",
    render: (value) => (
      <span className="text-slate-700 dark:text-slate-300">
        {value || 0} attendees
      </span>
    ),
  },
  {
    key: "actions",
    title: "",
    className: "w-8 text-sm",
    render: (_, row) => <SessionActions session={row} />,
    searchable: false,
  },
];

// Hook to get responsive columns
export function useSessionColumns() {
  const isMobile = useIsMobile();
  return isMobile ? sessionColumnsMobile : sessionColumnsDesktop;
}

// Default export for backward compatibility
export const sessionColumns = sessionColumnsDesktop;
