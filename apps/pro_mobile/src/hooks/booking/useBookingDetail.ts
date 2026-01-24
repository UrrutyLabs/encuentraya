import { trpc } from "@lib/trpc/client";
import { useSmartPolling } from "../shared/useSmartPolling";

/**
 * Hook to fetch booking details by ID
 * Encapsulates the booking.getById query with smart polling
 */
export function useBookingDetail(bookingId: string | undefined) {
  // Smart polling: pauses when app is in background, resumes in foreground
  const pollingOptions = useSmartPolling({
    interval: 5000, // Poll every 5 seconds when in foreground (more frequent for detail view)
    enabled: !!bookingId,
    refetchOnForeground: true,
  });

  const {
    data: booking,
    isLoading,
    error,
    refetch,
  } = trpc.booking.getById.useQuery(
    { id: bookingId || "" },
    {
      enabled: !!bookingId,
      retry: false,
      ...pollingOptions, // Spread smart polling options
    }
  );

  return {
    booking,
    isLoading,
    error,
    refetch,
  };
}
