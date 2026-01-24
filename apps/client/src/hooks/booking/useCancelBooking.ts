import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { logger } from "@/lib/logger";
import { useQueryClient } from "../shared";
import { invalidateRelatedQueries } from "@/lib/react-query/utils";

/**
 * Hook to cancel a booking
 * Encapsulates the booking.cancel mutation and handles navigation
 * Invalidates related queries for instant UI updates
 */
export function useCancelBooking(bookingId?: string) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const cancelBooking = trpc.booking.cancel.useMutation({
    // Invalidate related queries for instant UI updates
    ...invalidateRelatedQueries(queryClient, [
      [["booking", "myBookings"]],
      ...(bookingId ? [[["booking", "getById"], { id: bookingId }]] : []),
    ]),
    onSuccess: () => {
      router.push("/my-bookings");
    },
  });

  const handleCancel = async (bookingId: string) => {
    try {
      await cancelBooking.mutateAsync({ bookingId });
      // Success - mutation's onSuccess will handle redirect
    } catch (error) {
      logger.error(
        "Error cancelling booking",
        error instanceof Error ? error : new Error(String(error)),
        {
          bookingId,
        }
      );
      throw error;
    }
  };

  return {
    cancelBooking: handleCancel,
    isPending: cancelBooking.isPending,
    error: cancelBooking.error,
  };
}
