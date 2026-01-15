import { trpc } from "@/lib/trpc/client";
import { useSmartPolling } from "../shared";
import { BookingStatus } from "@repo/domain";

export function useBookingDetail(bookingId: string | undefined) {
  // Smart polling: pauses when page is hidden, resumes when visible
  const pollingOptions = useSmartPolling({
    interval: 5000, // Poll every 5 seconds when page is visible (more frequent for detail view)
    enabled: !!bookingId,
    refetchOnForeground: true,
  });

  // Fetch booking by id with smart polling
  const bookingQuery = trpc.booking.getById.useQuery(
    { id: bookingId || "" },
    {
      enabled: !!bookingId,
      retry: false,
      ...pollingOptions, // Spread smart polling options
    }
  );
  const booking = bookingQuery?.data;
  const isLoading = bookingQuery?.isLoading ?? false;
  const error = bookingQuery?.error;
  const refetch = bookingQuery?.refetch;

  // Fetch pro details conditionally
  const proQuery = trpc.pro.getById.useQuery(
    { id: booking?.proId ?? "" },
    {
      enabled: !!booking?.proId,
      retry: false,
    }
  );
  const pro = proQuery?.data;

  // Fetch existing review for this booking (only if completed)
  const reviewQuery = trpc.review.byBooking.useQuery(
    { bookingId: bookingId || "" },
    {
      enabled: !!bookingId && booking?.status === BookingStatus.COMPLETED,
      retry: false,
    }
  );
  const existingReview = reviewQuery?.data;

  // Fetch payment info for PENDING_PAYMENT bookings
  const paymentQuery = trpc.payment.getByBooking.useQuery(
    { bookingId: bookingId || "" },
    {
      enabled: !!bookingId && booking?.status === BookingStatus.PENDING_PAYMENT,
      retry: false,
    }
  );
  const payment = paymentQuery?.data;

  return {
    booking,
    pro,
    existingReview,
    payment,
    isLoading,
    error,
    refetch,
  };
}
