"use client";
import { useEffect, useState } from "react";
import DistrictActions from "./DistrictActions";
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

// Mobile columns (2 essential columns)
export const districtColumnsMobile: Column<any>[] = [
  {
    key: "name",
    title: "District",
    className: "text-xs",
    render: (value, row) => (
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-linear-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white font-semibold text-xs shrink-0">
          {value?.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <div className="font-medium text-slate-900 dark:text-white line-clamp-1 text-xs">
            {value}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {row._count?.members || 0} members
          </div>
        </div>
      </div>
    ),
  },
  {
    key: "actions",
    title: "",
    className: "w-8 text-sm",
    render: (_, row) => <DistrictActions district={row} />,
    searchable: false,
  },
];

// Desktop columns (all columns)
export const districtColumnsDesktop: Column<any>[] = [
  {
    key: "name",
    title: "District",
    className: "text-xs",
    render: (value, row) => (
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-linear-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white font-semibold text-xs">
          {value?.charAt(0).toUpperCase()}
        </div>
        <div>
          <div className="font-medium text-slate-900 dark:text-white line-clamp-1">
            {value}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {row.createdAt ? new Date(row.createdAt).toLocaleDateString() : "-"}
          </div>
        </div>
      </div>
    ),
  },
  {
    key: "_count",
    title: "Members",
    className: "text-xs hidden md:table-cell",
    render: (value) => (
      <span className="text-slate-700 dark:text-slate-300">
        {value?.members || 0}
      </span>
    ),
  },
  {
    key: "actions",
    title: "",
    className: "w-8 text-sm",
    render: (_, row) => <DistrictActions district={row} />,
    searchable: false,
  },
];

// Hook to get responsive columns
export function useDistrictColumns() {
  const isMobile = useIsMobile();
  return isMobile ? districtColumnsMobile : districtColumnsDesktop;
}

// Default export for backward compatibility
export const districtColumns = districtColumnsDesktop;
