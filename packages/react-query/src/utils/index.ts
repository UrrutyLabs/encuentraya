/**
 * React Query utilities and helpers
 * Provides optimistic update helpers and query invalidation utilities
 */

import type { QueryClient } from "@tanstack/react-query";

/**
 * Helper to check if an error is a client error (4xx)
 * Checks for tRPC errors with httpStatus in the 400-499 range
 */
export function isClientError(error: unknown): boolean {
  if (error && typeof error === "object") {
    // Check for tRPC error structure
    if ("data" in error) {
      const errorData = (error as { data?: unknown }).data;
      if (errorData && typeof errorData === "object" && "httpStatus" in errorData) {
        const status = (errorData as { httpStatus: number }).httpStatus;
        return status >= 400 && status < 500;
      }
    }
    // Check for standard HTTP error with status property
    if ("status" in error) {
      const status = (error as { status: number }).status;
      return status >= 400 && status < 500;
    }
  }
  return false;
}

/**
 * Helper to check if an error is a server error (5xx)
 * Checks for tRPC errors with httpStatus in the 500+ range
 */
export function isServerError(error: unknown): boolean {
  if (error && typeof error === "object") {
    // Check for tRPC error structure
    if ("data" in error) {
      const errorData = (error as { data?: unknown }).data;
      if (errorData && typeof errorData === "object" && "httpStatus" in errorData) {
        const status = (errorData as { httpStatus: number }).httpStatus;
        return status >= 500;
      }
    }
    // Check for standard HTTP error with status property
    if ("status" in error) {
      const status = (error as { status: number }).status;
      return status >= 500;
    }
  }
  return false;
}

/**
 * Optimistic update configuration
 */
export interface OptimisticUpdateConfig<TData, TVariables> {
  /**
   * Query key to update optimistically
   */
  queryKey: unknown[];
  /**
   * Function to generate optimistic data from variables
   */
  optimisticData: (variables: TVariables) => TData;
  /**
   * Function to rollback to previous data on error
   */
  rollback?: (previousData: TData | undefined) => TData | undefined;
}

/**
 * Create optimistic update callbacks for a mutation
 */
export function createOptimisticUpdate<TData, TVariables>(
  queryClient: QueryClient,
  config: OptimisticUpdateConfig<TData, TVariables>
) {
  return {
    onMutate: async (variables: TVariables) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: config.queryKey });

      // Snapshot previous value
      const previousData = queryClient.getQueryData<TData>(config.queryKey);

      // Optimistically update
      const optimisticData = config.optimisticData(variables);
      queryClient.setQueryData<TData>(config.queryKey, optimisticData);

      // Return context with previous data for rollback
      return { previousData };
    },
    onError: (error: Error, variables: TVariables, context: { previousData?: TData }) => {
      // Rollback on error
      if (config.rollback && context?.previousData !== undefined) {
        queryClient.setQueryData<TData>(config.queryKey, config.rollback(context.previousData));
      } else if (context?.previousData !== undefined) {
        queryClient.setQueryData<TData>(config.queryKey, context.previousData);
      }
    },
    onSettled: () => {
      // Always refetch after mutation settles
      queryClient.invalidateQueries({ queryKey: config.queryKey });
    },
  };
}

/**
 * Invalidate related queries after a mutation
 */
export function invalidateRelatedQueries(
  queryClient: QueryClient,
  queryKeys: unknown[][]
) {
  return {
    onSuccess: () => {
      queryKeys.forEach((queryKey) => {
        queryClient.invalidateQueries({ queryKey });
      });
    },
  };
}

/**
 * Refetch queries after a mutation
 */
export function refetchQueries(
  queryClient: QueryClient,
  queryKeys: unknown[][]
) {
  return {
    onSuccess: async () => {
      await Promise.all(
        queryKeys.map((queryKey) => queryClient.refetchQueries({ queryKey }))
      );
    },
  };
}
