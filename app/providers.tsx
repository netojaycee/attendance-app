/**
 * App Providers Component
 * Wraps the entire app with necessary providers:
 * - NextAuth SessionProvider
 * - TanStack Query QueryClientProvider
 * - React Hot Toast (Sonner)
 */

"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ReactNode, useState } from "react";
import { AuthInitializer } from "@/components/local/auth-initializer";

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Don't refetch on window focus
            refetchOnWindowFocus: false,
            // Keep data for 5 minutes
            staleTime: 5 * 60 * 1000,
            // Retry failed requests once
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthInitializer>
        {children}
      </AuthInitializer>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
