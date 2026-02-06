"use client";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import EventActions from "./EventActions";
import { Column } from "@/components/custom/custom-table";

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

// Mobile columns (3 essential columns)
export const eventColumnsMobile: Column<any>[] = [
  {
    key: "title",
    title: "Event",
    className: "text-xs",
    render: (value, row) => (
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-linear-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-semibold text-xs shrink-0">
          {value?.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <div className="font-medium text-slate-900 dark:text-white line-clamp-1 text-xs">
            {value}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
            {format(new Date(row.startDate), "MMM dd")} -{" "}
            {format(new Date(row.endDate), "MMM dd")}
          </div>
        </div>
      </div>
    ),
  },
  {
    key: "type",
    title: "Type",
    className: "text-xs",
    render: (value) => (
      <Badge
        variant={value === "MULTI_DISTRICT" ? "default" : "secondary"}
        className="whitespace-nowrap text-xs"
      >
        {value === "MULTI_DISTRICT" ? "Multi" : "Single"}
      </Badge>
    ),
  },
  {
    key: "actions",
    title: "",
    className: "w-8 text-sm",
    render: (_, row) => <EventActions event={row} />,
    searchable: false,
  },
];

// Desktop columns (all columns)
export const eventColumnsDesktop: Column<any>[] = [
  {
    key: "title",
    title: "Event",
    className: "text-xs",
    render: (value, row) => (
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-linear-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-semibold text-xs">
          {value?.charAt(0).toUpperCase()}
        </div>
        <div>
          <div className="font-medium text-slate-900 dark:text-white line-clamp-1">
            {value}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
            {format(new Date(row.startDate), "MMM dd, yyyy")} -{" "}
            {format(new Date(row.endDate), "MMM dd, yyyy")}
          </div>
        </div>
      </div>
    ),
  },
  {
    key: "type",
    title: "Type",
    className: "text-xs hidden md:table-cell",
    render: (value) => (
      <Badge
        variant={value === "MULTI_DISTRICT" ? "default" : "secondary"}
        className="whitespace-nowrap"
      >
        {value === "MULTI_DISTRICT" ? "Multi" : "Single"}
      </Badge>
    ),
  },
  {
    key: "district",
    title: "District",
    className: "text-xs hidden lg:table-cell",
    render: (value, row) => (
      <span className="text-slate-700 dark:text-slate-300">
        {row.type === "MULTI_DISTRICT" ? "All" : value?.name || "-"}
      </span>
    ),
  },
  {
    key: "passMark",
    title: "Pass Mark",
    className: "text-xs hidden md:table-cell",
    render: (value) => (
      <div className="flex items-center gap-1">
        <span className="font-semibold text-slate-900 dark:text-white">
          {value}%
        </span>
      </div>
    ),
  },
  {
    key: "_count",
    title: "Sessions",
    className: "text-xs hidden lg:table-cell",
    render: (value) => (
      <span className="text-slate-700 dark:text-slate-300">
        {value?.sessions || 0} sessions
      </span>
    ),
  },
  {
    key: "actions",
    title: "",
    className: "w-8 text-sm",
    render: (_, row) => <EventActions event={row} />,
    searchable: false,
  },
];

// Hook to get responsive columns
export function useEventColumns() {
  const isMobile = useIsMobile();
  return isMobile ? eventColumnsMobile : eventColumnsDesktop;
}

// Default export for backward compatibility
export const eventColumns = eventColumnsDesktop;
