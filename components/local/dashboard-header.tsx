"use client";

import { useAuthStore } from "@/lib/stores/auth-store";
import { useRouter } from "next/navigation";
import { useLogout } from "@/lib/hooks/use-auth";
import { Button } from "@/components/ui/button";

import { LogOut } from "lucide-react";
import { toast } from "sonner";
import { ModeToggle } from "./ModeToggle";

export function DashboardHeader() {
  const router = useRouter();
  const { user, iUser, logout } = useAuthStore();

  const { mutate: logoutMutate, isPending: isLoggingOut } = useLogout();

  const handleLogout = () => {
    logoutMutate(undefined, {
      onSuccess: () => {
        logout();
        router.push("/login");
        toast.success("Logged out successfully");
      },
      onError: (error: any) => {
        console.error("Failed to logout:", error);
        toast.error(error?.data?.error || "Failed to logout");
      },
    });
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/95 backdrop-blur supports-backdrop-filter:dark:bg-slate-900/60 supports-backdrop-filter:bg-white/60 shadow-sm dark:shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: App Name & User Info */}
          <div className="flex flex-col gap-0.5 min-w-0">
            <h1 className="text-xl font-bold bg-linear-to-r from-[#833CF6] to-[#10B981] bg-clip-text text-transparent">
              Attendance
            </h1>
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3 text-xs text-slate-600 dark:text-slate-300 truncate">
              <span className="truncate">
                Logged in as{" "}
                <span className="font-medium text-slate-900 dark:text-slate-100">
                  {user?.firstName} {user?.lastName}
                </span>
              </span>
              {iUser && (
                <span className="text-[#10B981] dark:text-[#34d399] truncate">
                  Viewing as{" "}
                  <span className="font-medium text-[#059669] dark:text-[#10B981]">
                    {iUser?.firstName} {iUser?.lastName}
                  </span>
                </span>
              )}
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-1">
            <ModeToggle />

            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-xs hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
