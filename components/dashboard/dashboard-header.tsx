"use client";

import { Music, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/lib/actions/auth.actions";
import { useState } from "react";

export function DashboardHeader() {
  const pathname = usePathname();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Extract page name from pathname
  const getPageName = () => {
    const segments = pathname.split("/").filter(Boolean);
    if (segments.length === 0) return "Dashboard";

    const lastSegment = segments[segments.length - 1];
    return lastSegment
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const result = await logoutAction();
      if (result.success) {
        window.location.href = "/login";
      }
    } catch (error) {
      console.error("Logout failed:", error);
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 px-4 py-3 flex items-center justify-between border-b bg-card border-border">
      {/* Logo */}
      <div className="flex items-center gap-2">
        <div className="flex items-center justify-center w-10 h-10 rounded-full border-2 bg-primary/15 border-primary">
          <Music className="w-5 h-5 text-primary" />
        </div>
        <h1 className="text-lg font-bold text-foreground">
          {getPageName()}
        </h1>
      </div>

      {/* Page Name */}
      {/* <div className="flex-1 text-center">
        <h2 className="text-sm font-medium text-text-secondary">
          {getPageName()}
        </h2>
      </div> */}

      {/* Logout Button */}
      <Button
        onClick={handleLogout}
        disabled={isLoggingOut}
        variant="outline"
        size="icon"
        className="rounded-full border-border bg-card hover:border-destructive hover:bg-destructive/10 transition-colors"
        title="Logout"
      >
        <LogOut className="w-5 h-5 text-destructive" />
      </Button>
    </header>
  );
}
