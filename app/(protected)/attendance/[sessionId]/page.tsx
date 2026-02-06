
// app/(protected)/attendance/[sessionId]/page.tsx: Attendance form
// Fetches session, big time picker, live % calc (client)
// Submit server action with calculatePercentage
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";
import { revalidatePath } from "next/cache";
import { format } from "date-fns";
import { calculatePercentage } from "@/lib/utils";

// Server action
async function submitAttendance(formData: FormData, sessionId: string) {
  "use server";
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  // Check active window
  const session = await prisma.session.findUnique({ where: { id: sessionId } });
  if (!session || new Date() < session.startTime || new Date() > new Date(session.startTime.getTime() + 3 * 24 * 60 * 60 * 1000)) {
    throw new Error("Session not active");
  }

  const arrivalTime = new Date(formData.get("arrivalTime") as string);
  const percentage = calculatePercentage(session.startTime, arrivalTime, session.durationMinutes);

  await prisma.attendance.upsert({
    where: { userId_sessionId: { userId: user.id, sessionId } },
    update: { arrivalTime, percentage },
    create: { userId: user.id, sessionId, arrivalTime, percentage },
  });

  revalidatePath("/dashboard");
  toast.success("Attendance submitted");
}

export default async function AttendancePage({ params }: { params: { sessionId: string } }) {
  const session = await prisma.session.findUnique({ where: { id: params.sessionId } });
  if (!session) return <div>Session not found</div>;

//   const [arrivalTime, setArrivalTime] = useState(session.startTime.toISOString().slice(0, 16));
//   const previewPercent = calculatePercentage(session.startTime, new Date(arrivalTime), session.durationMinutes);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl">Session: {format(session.date, "PPP")}</h1>
      <form action={(fd) => submitAttendance(fd, params.sessionId)} className="space-y-4">
        {/* <Input type="datetime-local" name="arrivalTime" value={arrivalTime} onChange={(e) => setArrivalTime(e.target.value)} className="text-lg h-16" /> */}
        {/* <p className="text-2xl">Preview: {previewPercent}%</p> */}
        <Button type="submit" size="lg" className="w-full text-xl">Submit Arrival</Button>
      </form>
    </div>
  );
}