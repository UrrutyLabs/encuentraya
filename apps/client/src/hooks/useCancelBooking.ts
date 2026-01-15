import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { logger } from "@/lib/logger";
import { useQueryClient } from "./useQueryClient";
import { invalidateRelatedQueries } from "@/lib/react-query/utils";

/**
 * Hook to cancel a booking
 * Encapsulates the booking.cancel mutation and handles navigation
 */
export function useCancelBooking() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const cancelBooking = trpc.booking.cancel.useMutation({
    ...invalidateRelatedQueries(queryClient, [
      [["booking", "myBookings"]],
      [["booking", "getById"]],
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
      logger.error("Error cancelling booking", error instanceof Error ? error : new Error(String(error)), {
        bookingId,
      });
      throw error;
    }
  };

  return {
    cancelBooking: handleCancel,
    isPending: cancelBooking.isPending,
    error: cancelBooking.error,
  };
}
