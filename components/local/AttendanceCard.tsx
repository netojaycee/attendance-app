// components/ui/AttendanceCard.tsx: Card for attendance display
// Shows details in simple format

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Attendance } from "@/prisma/generated/client";
import { format } from "date-fns";

interface AttendanceCardProps {
  attendance: Attendance;
}

export function AttendanceCard({ attendance }: AttendanceCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{format(attendance.arrivalTime, "PPP p")}</CardTitle>
      </CardHeader>
      <CardContent>
        <p>Percentage: {attendance.percentage}%</p>
      </CardContent>
    </Card>
  );
}