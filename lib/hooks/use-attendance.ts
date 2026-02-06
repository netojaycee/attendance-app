/**
 * TanStack Query Hooks - Attendance
 */

import { Attendance } from "@/prisma/generated/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const QUERY_KEYS = {
  attendance: {
    all: ["attendance"] as const,
    lists: () => [...QUERY_KEYS.attendance.all, "list"] as const,
    list: (filters?: unknown) =>
      [...QUERY_KEYS.attendance.lists(), { filters }] as const,
    details: () => [...QUERY_KEYS.attendance.all, "detail"] as const,
    detail: (sessionId: string, userId: string) =>
      [...QUERY_KEYS.attendance.details(), sessionId, userId] as const,
    userStats: (userId: string) =>
      [...QUERY_KEYS.attendance.all, "stats", userId] as const,
    sessionAttendance: (sessionId: string) =>
      [...QUERY_KEYS.attendance.all, "session", sessionId] as const,
  },
};

interface AttendanceRecord extends Attendance {
  user?: { firstName: string; lastName: string };
}

export function useSessionAttendance(sessionId: string) {
  return useQuery<{ data: AttendanceRecord[] }>({
    queryKey: QUERY_KEYS.attendance.sessionAttendance(sessionId),
    queryFn: async () => {
      const res = await fetch(`/api/v1/sessions/${sessionId}/attendance`);
      if (!res.ok) throw new Error("Failed to fetch attendance");
      return res.json();
    },
    enabled: !!sessionId,
  });
}

export function useUserAttendanceStats(userId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.attendance.userStats(userId),
    queryFn: async () => {
      const res = await fetch(`/api/v1/users/${userId}/attendance-summary`);
      if (!res.ok) throw new Error("Failed to fetch attendance stats");
      return res.json();
    },
    enabled: !!userId,
  });
}

export function useSubmitAttendance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      sessionId: string;
      arrivalTime: string;
    }) => {
      const res = await fetch("/api/v1/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to submit attendance");
      }

      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.attendance.sessionAttendance(variables.sessionId),
      });
    },
  });
}

export function useUpdateAttendance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      sessionId: string;
      userId: string;
      arrivalTime: string;
    }) => {
      const res = await fetch(
        `/api/v1/sessions/${data.sessionId}/attendance/${data.userId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ arrivalTime: data.arrivalTime }),
        }
      );

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update attendance");
      }

      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.attendance.sessionAttendance(variables.sessionId),
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.attendance.userStats(variables.userId),
      });
    },
  });
}

export function useDeleteAttendance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      sessionId,
      userId,
    }: {
      sessionId: string;
      userId: string;
    }) => {
      const res = await fetch(
        `/api/v1/sessions/${sessionId}/attendance/${userId}`,
        {
          method: "DELETE",
        }
      );

      if (!res.ok) throw new Error("Failed to delete attendance");
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.attendance.sessionAttendance(variables.sessionId),
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.attendance.userStats(variables.userId),
      });
    },
  });
}