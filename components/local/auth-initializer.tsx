"use client";

import { ReactNode, useEffect } from "react";
import { useAuthStore } from "@/lib/stores/auth-store";
import { getCurrentUserAction } from "@/lib/actions/auth.actions";

/**
 * AuthInitializer component
 * Initializes user auth state once on app load and stores in Zustand
 * User data is cached globally and accessible via useAuthStore throughout the app
 */
export function AuthInitializer({ children }: { children: ReactNode }) {
  const { initializeUser, isInitialized } = useAuthStore();

  useEffect(() => {
    const initAuth = async () => {
      try {
        const result = await getCurrentUserAction();
        if (result.success && result.data) {
          const authUser = {
            id: result.data.id as string,
            email: result.data.email as string,
            firstName: result.data.firstName as string,
            lastName: result.data.lastName as string,
            role: result.data.role as string,
          };
          initializeUser(authUser);
        } else {
          initializeUser(null);
        }
      } catch (error) {
        console.error("Failed to initialize auth:", error);
        initializeUser(null);
      }
    };

    if (!isInitialized) {
      initAuth();
    }
  }, [initializeUser, isInitialized]);

  return <>{children}</>;
}
