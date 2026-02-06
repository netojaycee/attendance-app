"use client";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import UserActions from "./UserActions";
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
export const userColumnsMobile: Column<any>[] = [
  {
    key: "firstName",
    title: "User",
    className: "text-xs",
    render: (value, row) => (
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-linear-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold text-xs shrink-0">
          {value?.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <div className="font-medium text-slate-900 dark:text-white line-clamp-1 text-xs">
            {value} {row.lastName}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
            {row.email}
          </div>
        </div>
      </div>
    ),
  },
  {
    key: "actions",
    title: "",
    className: "w-8 text-sm",
    render: (_, row) => <UserActions user={row} />,
    searchable: false,
  },
];

// Desktop columns (all columns)
export const userColumnsDesktop: Column<any>[] = [
  {
    key: "firstName",
    title: "User",
    className: "text-xs",
    render: (value, row) => (
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-linear-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold text-xs">
          {value?.charAt(0).toUpperCase()}
        </div>
        <div>
          <div className="font-medium text-slate-900 dark:text-white line-clamp-1">
            {value} {row.lastName}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {row.email}
          </div>
        </div>
      </div>
    ),
  },
  {
    key: "voicePart",
    title: "Voice & District",
    className: "text-xs hidden md:table-cell",
    render: (value, row) => (
      <div className="flex flex-col gap-1.5">
        <Badge variant="outline" className="text-xs w-fit">
          {value}
        </Badge>
        <Badge variant="outline" className="text-xs w-fit">
          {row.district.name || "—"}
        </Badge>
      </div>
    ),
  },
  {
    key: "role",
    title: "Role",
    className: "text-xs hidden lg:table-cell",
    render: (value) => (
      <Badge variant="secondary" className="text-xs capitalize">
        {value?.replace(/_/g, " ")}
      </Badge>
    ),
  },
  {
    key: "actions",
    title: "",
    className: "w-8 text-sm",
    render: (_, row) => <UserActions user={row} />,
    searchable: false,
  },
];

// Hook to get responsive columns
export function useUserColumns() {
  const isMobile = useIsMobile();
  return isMobile ? userColumnsMobile : userColumnsDesktop;
}

// Default export for backward compatibility
export const userColumns = userColumnsDesktop;
