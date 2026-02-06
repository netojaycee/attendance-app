/**
 * TanStack Query Hooks - Events
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Event, Session } from "@prisma/client";

const QUERY_KEYS = {
  events: {
    all: ["events"] as const,
    lists: () => [...QUERY_KEYS.events.all, "list"] as const,
    list: (filters?: unknown) =>
      [...QUERY_KEYS.events.lists(), { filters }] as const,
    details: () => [...QUERY_KEYS.events.all, "detail"] as const,
    detail: (id: string) => [...QUERY_KEYS.events.details(), id] as const,
    sessions: (eventId: string) =>
      [...QUERY_KEYS.events.detail(eventId), "sessions"] as const,
    stats: (eventId: string) =>
      [...QUERY_KEYS.events.detail(eventId), "stats"] as const,
  },
};

interface ListEventsResponse {
  data: (Event & { sessionCount: number })[];
  total: number;
}

interface GetEventResponse {
  data: Event & { sessions: Session[] };
}

export function useEvents(filters?: { districtId?: string; type?: string }) {
  return useQuery<ListEventsResponse>({
    queryKey: QUERY_KEYS.events.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.districtId) params.set("districtId", filters.districtId);
      if (filters?.type) params.set("type", filters.type);

      const res = await fetch(`/api/v1/events?${params}`);
      if (!res.ok) throw new Error("Failed to fetch events");
      return res.json();
    },
  });
}

export function useEvent(eventId: string) {
  return useQuery<GetEventResponse>({
    queryKey: QUERY_KEYS.events.detail(eventId),
    queryFn: async () => {
      const res = await fetch(`/api/v1/events/${eventId}`);
      if (!res.ok) throw new Error("Failed to fetch event");
      return res.json();
    },
    enabled: !!eventId,
  });
}

export function useEventStats(eventId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.events.stats(eventId),
    queryFn: async () => {
      const res = await fetch(`/api/v1/events/${eventId}/stats`);
      if (!res.ok) throw new Error("Failed to fetch event stats");
      return res.json();
    },
    enabled: !!eventId,
  });
}

export function useCreateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      title: string;
      description?: string;
      type: string;
      startDate: string;
      endDate?: string;
      districtId?: string;
    }) => {
      const res = await fetch("/api/v1/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create event");
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.events.all });
    },
  });
}

export function useUpdateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<Event>;
    }) => {
      const res = await fetch(`/api/v1/events/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error("Failed to update event");
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.events.detail(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.events.all });
    },
  });
}

export function useDeleteEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (eventId: string) => {
      const res = await fetch(`/api/v1/events/${eventId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete event");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.events.all });
    },
  });
}