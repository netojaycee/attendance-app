
// app/dashboard/page.tsx: Role-based dashboard
// Fetches data server-side, renders scoped views
// Uses cards, tables for summaries, upcoming lists

import { getCurrentUser } from "@/lib/auth-utils";
import prisma from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { AttendanceCard } from "@/components/local/AttendanceCard"; // Custom
import { motion } from "framer-motion";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) return <Skeleton className="h-screen" />;

  // Fetch scoped data based on role
  let events, sessions, attendances;
  if (user.role === "ADMIN") {
    events = await prisma.event.findMany();
    // Overview logic
  } else if (user.role === "DISTRICT_LEADER") {
    events = await prisma.event.findMany({ where: { districtId: user.districtId } });
  } else if (user.role === "PART_LEADER") {
    // Voice part scoped
    attendances = await prisma.attendance.findMany({
      where: { user: { voicePart: user.voicePart, districtId: user.districtId } },
    });
  } else {
    sessions = await prisma.session.findMany({
      where: { event: { districtId: user.districtId }, date: { gte: new Date() } },
      orderBy: { date: "asc" },
    });
    attendances = await prisma.attendance.findMany({ where: { userId: user.id } });
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">Welcome, {user.firstname}</CardTitle>
        </CardHeader>
        <CardContent>
          {user.role === "USER" && (
            <>
              <h2 className="text-2xl">Upcoming Sessions</h2>
              {sessions?.map((s) => (
                <div key={s.id}>{format(s.date, "PPP")} at {format(s.startTime, "p")}</div>
              ))}
              <h2 className="text-2xl">Your Attendances</h2>
              {attendances?.map((a) => <AttendanceCard key={a.id} attendance={a} />)}
            </>
          )}
          {/* Similar for other roles */}
          {/* TODO: Add overviews for admin/leaders */}
        </CardContent>
      </Card>
    </motion.div>
  );
}