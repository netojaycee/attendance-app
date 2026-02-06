"use client";

export function DashboardFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/95 backdrop-blur supports-backdrop-filter:dark:bg-slate-900/60 supports-backdrop-filter:bg-white/60 shadow-sm dark:shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-center">
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
            © {currentYear}{" "}
            <span className="font-semibold bg-linear-to-r from-[#833CF6] to-[#10B981] bg-clip-text text-transparent">
              Attendance
            </span>
            . All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
