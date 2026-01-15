import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { BookingStatus, Category } from "@repo/domain";
import { logger } from "@/lib/logger";
import { useQueryClient } from "../shared";
import { invalidateRelatedQueries } from "@/lib/react-query/utils";

export interface CreateBookingInput {
  proId: string;
  category: Category;
  description: string;
  scheduledAt: Date;
  estimatedHours: number;
}

/**
 * Hook to create a booking
 * Encapsulates the booking.create mutation and handles navigation
 */
export function useCreateBooking() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const createBooking = trpc.booking.create.useMutation({
    ...invalidateRelatedQueries(queryClient, [
      [["booking", "myBookings"]],
    ]),
    onSuccess: (data) => {
      // Redirect based on booking status
      if (data.status === BookingStatus.PENDING_PAYMENT) {
        router.push(`/checkout?bookingId=${data.id}`);
      } else {
        router.push(`/my-bookings/${data.id}`);
      }
    },
  });

  const handleCreate = async (input: CreateBookingInput) => {
    try {
      await createBooking.mutateAsync(input);
      // Success - mutation's onSuccess will handle redirect
    } catch (error) {
      logger.error("Error creating booking", error instanceof Error ? error : new Error(String(error)), {
        input,
      });
      throw error;
    }
  };

  return {
    createBooking: handleCreate,
    isPending: createBooking.isPending,
    error: createBooking.error,
  };
}
