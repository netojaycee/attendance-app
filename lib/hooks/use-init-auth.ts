"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/lib/stores/auth-store";

/**
 * Initialize auth state from cookies endpoint
 * Call this hook once in the app root to sync user data to Zustand store
 */
export function useInitAuth() {
  useEffect(() => {
    const initAuth = async () => {
      try {
        const res = await fetch("/api/v1/auth/cookies");
        if (res.ok) {
          const { user } = await res.json();
          useAuthStore.setState({
            user: user || null,
            isLoading: false,
            isError: false,
          });
        } else {
          useAuthStore.setState({
            user: null,
            isLoading: false,
            isError: true,
          });
        }
      } catch (error) {
        console.error("Failed to init auth:", error);
        useAuthStore.setState({
          user: null,
          isLoading: false,
          isError: true,
        });
      }
    };

    initAuth();
  }, []);
}
