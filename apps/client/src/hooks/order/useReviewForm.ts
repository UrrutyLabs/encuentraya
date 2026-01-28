import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { OrderStatus } from "@repo/domain";

/**
 * Hook to handle review creation flow
 * Encapsulates order details, existing review check, and review creation
 */
export function useReviewForm(orderId: string | undefined) {
  const router = useRouter();

  // Fetch order to verify it exists
  const { data: order, isLoading: isLoadingOrder } =
    trpc.order.getById.useQuery(
      { id: orderId! },
      {
        enabled: !!orderId,
        retry: false,
      }
    );

  // Fetch existing review for this order
  const { data: existingReview, isLoading: isLoadingReview } =
    trpc.review.byOrder.useQuery(
      { orderId: orderId! },
      {
        enabled: !!orderId,
        retry: false,
      }
    );

  const createReview = trpc.review.create.useMutation({
    onSuccess: () => {
      router.push(`/my-jobs/${orderId}`);
    },
  });

  const handleSubmit = async (rating: number, comment?: string) => {
    if (!orderId) return;
    try {
      await createReview.mutateAsync({
        orderId,
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
    order?.status === OrderStatus.COMPLETED && !existingReview;

  return {
    order,
    existingReview,
    isLoading: isLoadingOrder || isLoadingReview,
    createReview: handleSubmit,
    isPending: createReview.isPending,
    error: createReview.error,
    canCreateReview,
  };
}
