import { trpc } from "@lib/trpc/client";
import { useSmartPolling } from "../shared/useSmartPolling";
import { useAuth } from "../auth/useAuth";

/**
 * Hook to fetch pro inbox bookings (pending and accepted)
 * Encapsulates the booking.proInbox query with smart polling
 * Only fetches when user is authenticated
 */
export function useProInbox() {
  const { user } = useAuth();

  // Smart polling: pauses when app is in background, resumes in foreground
  const pollingOptions = useSmartPolling({
    interval: 10000, // Poll every 10 seconds when in foreground
    enabled: !!user, // Only poll when user is authenticated
    refetchOnForeground: true,
  });

  const {
    data: bookings = [],
    isLoading,
    error,
  } = trpc.booking.proInbox.useQuery(undefined, {
    enabled: !!user, // Only fetch when user is authenticated
    retry: false,
    ...pollingOptions, // Spread smart polling options
  });

  return {
    bookings,
    isLoading,
    error,
  };
}
