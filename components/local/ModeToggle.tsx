"use client";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";

export function ModeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="text-slate-500 dark:text-slate-400 hover:text-[#833CF6] dark:hover:text-[#10B981] hover:bg-[#833CF6]/10 dark:hover:bg-[#10B981]/10"
      title={theme === "dark" ? "Light mode" : "Dark mode"}
    >
      {theme === "dark" ? (
        <Sun className="w-4 h-4" />
      ) : (
        <Moon className="w-4 h-4" />
      )}
      <span className="text-xs hidden sm:inline ml-1">
        {theme === "dark" ? "Light" : "Dark"}
      </span>
    </Button>
  );
}
