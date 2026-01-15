import { useMemo } from "react";
import { trpc } from "@/lib/trpc/client";
import { useAuth } from "../auth";
import { useSmartPolling } from "../shared";
import { BookingStatus } from "@repo/domain";

export function useMyBookings() {
  const { user } = useAuth();

  // Smart polling: pauses when page is hidden, resumes when visible
  const pollingOptions = useSmartPolling({
    interval: 10000, // Poll every 10 seconds when page is visible
    enabled: !!user,
    refetchOnForeground: true,
  });

  const { data: bookings, isLoading, error } = trpc.booking.myBookings.useQuery(
    undefined,
    {
      enabled: !!user,
      retry: false,
      ...pollingOptions, // Spread smart polling options
    }
  );

  // Get booking IDs for completed bookings
  const completedBookingIds = useMemo(() => {
    if (!bookings) return [];
    return bookings
      .filter((b) => b.status === BookingStatus.COMPLETED)
      .map((b) => b.id);
  }, [bookings]);

  // Fetch review status for completed bookings
  const { data: reviewStatusMap = {} } = trpc.review.statusByBookingIds.useQuery(
    { bookingIds: completedBookingIds },
    {
      enabled: completedBookingIds.length > 0 && !!user,
      retry: false,
    }
  );

  return {
    bookings: bookings ?? [],
    isLoading,
    error,
    reviewStatusMap,
  };
}
