/**
 * Zustand Auth Store
 * Manages authentication state on the client side
 */

import { create } from "zustand";
import { devtools } from "zustand/middleware";

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  voicePart?: string;
  districtId?: string;
  [key: string]: any;
}

export const useAuthStore = create<{
  user: AuthUser | null;
  iUser: AuthUser | null;
  isLoading: boolean;
  isError: boolean;
  isInitialized: boolean;
  setUser: (user: AuthUser | null) => void;
  setIUser: (user: AuthUser | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: boolean) => void;
  setInitialized: (initialized: boolean) => void;
  initializeUser: (user: AuthUser | null) => void;
  logout: () => void;
}>()(
  devtools((set) => ({
    user: null,
    iUser: null,
    isLoading: true,
    isError: false,
    isInitialized: false,

    setUser: (user) => set({ user }),
    setIUser: (iUser) => set({ iUser }),
    setLoading: (isLoading) => set({ isLoading }),
    setError: (isError) => set({ isError }),
    setInitialized: (isInitialized) => set({ isInitialized }),
    initializeUser: (user) => set({ 
      user, 
      isLoading: false, 
      isInitialized: true,
      isError: user === null 
    }),
    logout: () => set({ user: null, iUser: null }),
  }), {
    name: "AuthStore",
  })
);