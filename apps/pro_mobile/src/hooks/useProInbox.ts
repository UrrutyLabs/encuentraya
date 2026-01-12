import { trpc } from "../lib/trpc/client";
import { useSmartPolling } from "./useSmartPolling";

/**
 * Hook to fetch pro inbox bookings (pending and accepted)
 * Encapsulates the booking.proInbox query with smart polling
 */
export function useProInbox() {
  // Smart polling: pauses when app is in background, resumes in foreground
  const pollingOptions = useSmartPolling({
    interval: 10000, // Poll every 10 seconds when in foreground
    enabled: true,
    refetchOnForeground: true,
  });

  const { data: bookings = [], isLoading, error } = trpc.booking.proInbox.useQuery(
    undefined,
    {
      retry: false,
      ...pollingOptions, // Spread smart polling options
    }
  );

  return {
    bookings,
    isLoading,
    error,
  };
}
