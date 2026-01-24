import { useMemo } from "react";
import { useAppState } from "./useAppState";

/**
 * Options for smart polling
 */
export interface SmartPollingOptions {
  /**
   * Polling interval in milliseconds when page is visible
   */
  interval: number;
  /**
   * Whether polling is enabled (default: true)
   */
  enabled?: boolean;
  /**
   * Whether to refetch when page becomes visible (default: true)
   */
  refetchOnForeground?: boolean;
}

/**
 * Return type for smart polling options
 */
export interface SmartPollingReturn {
  refetchInterval: number | false;
  refetchOnWindowFocus: boolean;
  refetchOnMount: boolean;
}

/**
 * Hook that provides smart polling configuration for React Query
 * - Polls when page is visible
 * - Stops polling when page is hidden (saves resources)
 * - Automatically refetches when page becomes visible
 *
 * @param options Polling configuration
 * @returns React Query options with smart polling enabled
 */
export function useSmartPolling(
  options: SmartPollingOptions
): SmartPollingReturn {
  const isForeground = useAppState();
  const { interval, enabled = true, refetchOnForeground = true } = options;

  return useMemo(() => {
    // Only poll when page is visible and polling is enabled
    const shouldPoll = isForeground && enabled;

    return {
      refetchInterval: shouldPoll ? interval : false,
      refetchOnWindowFocus: refetchOnForeground && enabled,
      // Refetch immediately when page becomes visible
      refetchOnMount: refetchOnForeground && enabled,
    };
  }, [isForeground, interval, enabled, refetchOnForeground]);
}
