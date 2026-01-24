"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, useCallback } from "react";
import { isNetworkError as isNetworkErrorHelper } from "@/lib/auth/error-detection";

/**
 * Detects network/server errors from React Query cache
 * Returns the most recent network error or null if none
 */
export function useNetworkError(): {
  error: Error | null;
  isNetworkError: boolean;
  clearError: () => void;
} {
  const queryClient = useQueryClient();
  const [error, setError] = useState<Error | null>(null);

  /**
   * Scan the query cache for network errors
   */
  const scanForNetworkErrors = useCallback(() => {
    const cache = queryClient.getQueryCache();
    const queries = cache.getAll();

    // Find the most recent network error
    let latestError: Error | null = null;
    let latestErrorTime = 0;

    for (const query of queries) {
      const queryError = query.state.error;
      if (queryError && isNetworkErrorHelper(queryError)) {
        // Use errorUpdatedAt if available, otherwise use dataUpdatedAt or current time
        const errorTime =
          query.state.errorUpdatedAt || query.state.dataUpdatedAt || Date.now();
        if (errorTime > latestErrorTime) {
          latestErrorTime = errorTime;
          latestError = queryError as Error;
        }
      }
    }

    setError(latestError);
  }, [queryClient]);

  // Scan for errors on mount and when cache changes
  useEffect(() => {
    // Initial scan - use setTimeout to avoid synchronous setState in effect
    const timeoutId = setTimeout(() => {
      scanForNetworkErrors();
    }, 0);

    // Subscribe to cache changes
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      // Re-scan when queries update (errors are detected via query.state.error)
      if (event?.type === "updated") {
        scanForNetworkErrors();
      }
    });

    return () => {
      clearTimeout(timeoutId);
      unsubscribe();
    };
  }, [queryClient, scanForNetworkErrors]);

  const clearError = useCallback(() => {
    setError(null);
    // Optionally refetch failed queries
    const cache = queryClient.getQueryCache();
    const queries = cache.getAll();
    for (const query of queries) {
      if (query.state.error && isNetworkErrorHelper(query.state.error)) {
        queryClient.refetchQueries({ queryKey: query.queryKey });
      }
    }
  }, [queryClient]);

  return {
    error,
    isNetworkError: error !== null,
    clearError,
  };
}
