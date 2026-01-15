/**
 * React Query configuration factory
 * Provides platform-agnostic QueryClient default options
 */

import type { DefaultOptions } from "@tanstack/react-query";
import { isClientError } from "../utils";

export interface QueryClientConfigOptions {
  /**
   * Whether to refetch on window focus
   * Mobile: typically false in dev, true in production
   * Web: typically false in dev, true in production
   */
  refetchOnWindowFocus?: boolean;
  /**
   * Network mode for queries
   * Mobile: "offlineFirst" for offline support
   * Web: "online" for immediate feedback
   */
  queryNetworkMode?: "online" | "offlineFirst" | "always";
  /**
   * Network mode for mutations
   * Mobile: "offlineFirst" to queue mutations
   * Web: "online" for immediate feedback
   */
  mutationNetworkMode?: "online" | "offlineFirst" | "always";
}

/**
 * Create default options for QueryClient
 * Platform-specific options can be customized via config
 */
export function createQueryClientDefaults(
  options: QueryClientConfigOptions = {}
): DefaultOptions {
  const {
    refetchOnWindowFocus = process.env.NODE_ENV === "production",
    queryNetworkMode = "online",
    mutationNetworkMode = "online",
  } = options;

  return {
    queries: {
      // Retry logic: don't retry on client errors (4xx), retry up to 2 times for server errors
      retry: (failureCount, error) => {
        if (isClientError(error)) {
          return false;
        }
        // Retry up to 2 times for server errors or network errors
        return failureCount < 2;
      },
      // Retry delay: exponential backoff (1s, 2s)
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Data is considered fresh for 5 minutes
      staleTime: 5 * 60 * 1000, // 5 minutes
      // Unused data is kept in cache for 10 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      // Refetch on window focus (configurable per platform)
      refetchOnWindowFocus,
      // Don't refetch on mount if data is fresh
      refetchOnMount: true,
      // Refetch on reconnect
      refetchOnReconnect: true,
      // Network mode (configurable per platform)
      networkMode: queryNetworkMode,
    },
    mutations: {
      // Retry mutations once on failure (useful for network errors)
      retry: 1,
      // Retry delay for mutations
      retryDelay: 1000,
      // Network mode (configurable per platform)
      networkMode: mutationNetworkMode,
    },
  };
}
