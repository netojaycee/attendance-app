
import { BottomNavigation } from "@/components/dashboard/bottom-navigation";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";

export default function ProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="max-w-3xl mx-auto min-h-screen bg-background-light dark:bg-background-dark">
      <DashboardHeader />

      <main className="flex-1 pb-24 pt-5">{children}</main>
      <BottomNavigation />
    </div>
  );
}
