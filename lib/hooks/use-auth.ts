/**
 * TanStack Query Hooks - Auth
 * Hooks for authentication-related queries and mutations
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  UnauthorizedError,
} from "@/lib/api-errors";
import { client } from "../client";

const QUERY_KEYS = {
  auth: {
    all: ["auth"] as const,
    me: ["auth", "me"] as const,
  },
};

/**
 * Get current authenticated user
 */
export function useAuth() {
  return useQuery({
    queryKey: QUERY_KEYS.auth.me,
    queryFn: async () => {
      const res = await fetch("/api/v1/auth/me");
      if (!res.ok) {
        throw new UnauthorizedError("Not authenticated");
      }
      return res.json() as Promise<{ data: any }>;
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Login with email and password
 */
export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      // Use the new client utility and correct endpoint
      return client("/auth/login", {
        method: "POST",
        body: credentials,
      });
    },
    onSuccess: () => {
      // Invalidate auth query to refetch user
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.auth.me });
    },
  });
}

/**
 * Logout
 */
export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      return client("/auth/logout", { method: "POST" });
    },
    onSuccess: () => {
      // Clear all queries
      queryClient.clear();
    },
  });
}

/**
 * Change password
 */
export function useChangePassword() {
  return useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      const res = await fetch("/api/v1/users/me/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to change password");
      }

      return res.json();
    },
  });
}

/**
 * Request password reset
 */
export function useRequestPasswordReset() {
  return useMutation({
    mutationFn: async (email: string) => {
      const res = await fetch("/api/v1/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        throw new Error("Failed to request password reset");
      }

      return res.json();
    },
  });
}

/**
 * Reset password with token
 */
export function useResetPassword() {
  return useMutation({
    mutationFn: async (data: { token: string; newPassword: string }) => {
      const res = await fetch("/api/v1/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        throw new Error("Failed to reset password");
      }

      return res.json();
    },
  });
}

/**
 * Verify magic link
 */
export function useMagicLinkVerify() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (token: string) => {
      const res = await fetch("/api/v1/auth/magic-link/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      if (!res.ok) {
        throw new Error("Failed to verify magic link");
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.auth.me });
    },
  });
}

/**
 * Impersonate a user
 */
export function useImpersonate() {
  return useMutation({
    mutationFn: async (data: {
      userId: string;
      firstName: string;
      lastName: string;
    }) => {
      return client("/auth/impersonate", {
        method: "POST",
        body: data,
      });
    },
  });
}

/**
 * Clear impersonation (stop impersonating)
 */
export function useClearImpersonate() {
  return useMutation({
    mutationFn: async () => {
      return client("/auth/impersonate", {
        method: "DELETE",
      });
    },
  });
}