/**
 * TanStack Query Hooks - Sessions
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Session } from "@prisma/client";
import { getNextSessionAction } from "@/lib/actions/sessions.actions";

const QUERY_KEYS = {
  sessions: {
    all: ["sessions"] as const,
    lists: () => [...QUERY_KEYS.sessions.all, "list"] as const,
    list: (filters?: unknown) =>
      [...QUERY_KEYS.sessions.lists(), { filters }] as const,
    details: () => [...QUERY_KEYS.sessions.all, "detail"] as const,
    detail: (id: string) => [...QUERY_KEYS.sessions.details(), id] as const,
    next: () => [...QUERY_KEYS.sessions.all, "next"] as const,
    attendance: (sessionId: string) =>
      [...QUERY_KEYS.sessions.detail(sessionId), "attendance"] as const,
  },
};

export function useSessions(eventId?: string) {
  return useQuery<{ data: Session[] }>({
    queryKey: QUERY_KEYS.sessions.list({ eventId }),
    queryFn: async () => {
      const url = eventId ? `/api/v1/events/${eventId}/sessions` : "/api/v1/sessions";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch sessions");
      return res.json();
    },
    enabled: !!eventId,
  });
}

export function useSession(sessionId: string) {
  return useQuery<{ data: Session }>({
    queryKey: QUERY_KEYS.sessions.detail(sessionId),
    queryFn: async () => {
      const res = await fetch(`/api/v1/sessions/${sessionId}`);
      if (!res.ok) throw new Error("Failed to fetch session");
      return res.json();
    },
    enabled: !!sessionId,
  });
}

export function useNextSession() {
  return useQuery({
    queryKey: QUERY_KEYS.sessions.next(),
    queryFn: async () => {
      const result = await getNextSessionAction();
      if (!result.success) throw new Error(result.error);
      return result;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
}

export function useCreateSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      eventId: string;
      date: string;
      startTime: string;
      endTime: string;
      durationMinutes: number;
      districtId: string;
    }) => {
      const res = await fetch("/api/v1/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create session");
      }

      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.sessions.list({ eventId: variables.eventId }),
      });
    },
  });
}

export function useUpdateSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<Session>;
    }) => {
      const res = await fetch(`/api/v1/sessions/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error("Failed to update session");
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.sessions.detail(variables.id),
      });
    },
  });
}

export function useDeleteSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sessionId: string) => {
      const res = await fetch(`/api/v1/sessions/${sessionId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete session");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.sessions.all });
    },
  });
}