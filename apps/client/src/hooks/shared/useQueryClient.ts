/**
 * Hook to get the QueryClient instance
 * Provides access to queryClient for manual cache operations
 */

import { useQueryClient as useRQQueryClient } from "@tanstack/react-query";
import { getQueryClient } from "@/lib/trpc/Provider";

/**
 * Hook to get QueryClient instance
 * Falls back to React Query's useQueryClient if available
 */
export function useQueryClient() {
  try {
    // Try to use React Query's hook first (works within QueryClientProvider)
    return useRQQueryClient();
  } catch {
    // Fallback to our exported instance if hook is not available
    return getQueryClient();
  }
}
