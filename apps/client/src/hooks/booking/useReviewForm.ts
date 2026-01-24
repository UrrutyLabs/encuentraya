import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { BookingStatus } from "@repo/domain";

/**
 * Hook to handle review creation flow
 * Encapsulates booking details, existing review check, and review creation
 */
export function useReviewForm(bookingId: string | undefined) {
  const router = useRouter();

  // Fetch booking to verify it exists
  const { data: booking, isLoading: isLoadingBooking } =
    trpc.booking.getById.useQuery(
      { id: bookingId! },
      {
        enabled: !!bookingId,
        retry: false,
      }
    );

  // Fetch existing review for this booking
  const { data: existingReview, isLoading: isLoadingReview } =
    trpc.review.byBooking.useQuery(
      { bookingId: bookingId! },
      {
        enabled: !!bookingId,
        retry: false,
      }
    );

  const createReview = trpc.review.create.useMutation({
    onSuccess: () => {
      router.push(`/my-bookings/${bookingId}`);
    },
  });

  const handleSubmit = async (rating: number, comment?: string) => {
    if (!bookingId) return;
    try {
      await createReview.mutateAsync({
        bookingId,
        rating,
        comment: comment || undefined,
      });
      // Success - mutation's onSuccess will handle redirect
    } catch (err) {
      // Error is handled by mutation state
      throw err;
    }
  };

  // Check if review can be created
  const canCreateReview =
    booking?.status === BookingStatus.COMPLETED && !existingReview;

  return {
    booking,
    existingReview,
    isLoading: isLoadingBooking || isLoadingReview,
    createReview: handleSubmit,
    isPending: createReview.isPending,
    error: createReview.error,
    canCreateReview,
  };
}
