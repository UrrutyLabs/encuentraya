import { useMemo } from "react";
import { useAppState } from "./useAppState";

/**
 * Options for smart polling
 */
export interface SmartPollingOptions {
  /**
   * Polling interval in milliseconds when app is in foreground
   */
  interval: number;
  /**
   * Whether polling is enabled (default: true)
   */
  enabled?: boolean;
  /**
   * Whether to refetch when app comes to foreground (default: true)
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
 * - Polls when app is in foreground
 * - Stops polling when app is in background (saves battery)
 * - Automatically refetches when app comes to foreground
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
    // Only poll when app is in foreground and polling is enabled
    const shouldPoll = isForeground && enabled;

    return {
      refetchInterval: shouldPoll ? interval : false,
      refetchOnWindowFocus: refetchOnForeground && enabled,
      // Refetch immediately when app comes to foreground
      refetchOnMount: refetchOnForeground && enabled,
    };
  }, [isForeground, interval, enabled, refetchOnForeground]);
}
