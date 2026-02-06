/**
 * TanStack Query Hooks - Users
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { User } from "@/prisma/generated/client";

const QUERY_KEYS = {
  users: {
    all: ["users"] as const,
    lists: () => [...QUERY_KEYS.users.all, "list"] as const,
    list: (filters?: unknown) =>
      [...QUERY_KEYS.users.lists(), { filters }] as const,
    details: () => [...QUERY_KEYS.users.all, "detail"] as const,
    detail: (id: string) => [...QUERY_KEYS.users.details(), id] as const,
  },
};

type UserWithoutPassword = Omit<User, "password">;

export function useUsers(filters?: {
  districtId?: string;
  role?: string;
  voicePart?: string;
}) {
  return useQuery<{ data: UserWithoutPassword[] }>({
    queryKey: QUERY_KEYS.users.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.districtId) params.set("districtId", filters.districtId);
      if (filters?.role) params.set("role", filters.role);
      if (filters?.voicePart) params.set("voicePart", filters.voicePart);

      const res = await fetch(`/api/v1/users?${params}`);
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json();
    },
  });
}

export function useUser(userId: string) {
  return useQuery<{ data: UserWithoutPassword }>({
    queryKey: QUERY_KEYS.users.detail(userId),
    queryFn: async () => {
      const res = await fetch(`/api/v1/users/${userId}`);
      if (!res.ok) throw new Error("Failed to fetch user");
      return res.json();
    },
    enabled: !!userId,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      email: string;
      firstName: string;
      lastName: string;
      voicePart: string;
      role?: string;
      districtId: string;
      instrument?: string;
    }) => {
      const res = await fetch("/api/v1/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create user");
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.users.all });
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<Omit<User, "password">>;
    }) => {
      const res = await fetch(`/api/v1/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update user");
      }

      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.users.detail(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.users.all });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const res = await fetch(`/api/v1/users/${userId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete user");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.users.all });
    },
  });
}

export function useBulkCreateUsers() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      users: Array<{
        email: string;
        firstName: string;
        lastName: string;
        voicePart: string;
        districtId: string;
        instrument?: string;
      }>;
    }) => {
      const res = await fetch("/api/v1/users/bulk-create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create users");
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.users.all });
    },
  });
}