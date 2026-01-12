import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";

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
      console.error("Error cancelling booking:", error);
      throw error;
    }
  };

  return {
    cancelBooking: handleCancel,
    isPending: cancelBooking.isPending,
    error: cancelBooking.error,
  };
}
