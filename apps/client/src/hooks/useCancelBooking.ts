import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { logger } from "@/lib/logger";

/**
 * Hook to cancel a booking
 * Encapsulates the booking.cancel mutation and handles navigation
 */
export function useCancelBooking() {
  const router = useRouter();

  const cancelBooking = trpc.booking.cancel.useMutation({
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
