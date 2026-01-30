import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { logger } from "@/lib/logger";
import { useQueryClient } from "../shared";
import { invalidateRelatedQueries } from "@/lib/react-query/utils";

/**
 * Hook to cancel an order
 * Encapsulates the order.cancel mutation and handles navigation
 * Invalidates related queries for instant UI updates
 */
export function useCancelOrder(orderId?: string) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const cancelOrder = trpc.order.cancel.useMutation({
    // Invalidate related queries for instant UI updates
    ...invalidateRelatedQueries(queryClient, [
      [["order", "listByClient"]],
      ...(orderId ? [[["order", "getById"], { id: orderId }]] : []),
    ]),
    onSuccess: () => {
      router.push("/my-jobs");
    },
  });

  const handleCancel = async (orderId: string, reason?: string) => {
    try {
      await cancelOrder.mutateAsync({ orderId, reason });
      // Success - mutation's onSuccess will handle redirect
    } catch (error) {
      logger.error(
        "Error cancelling order",
        error instanceof Error ? error : new Error(String(error)),
        {
          orderId,
        }
      );
      throw error;
    }
  };

  return {
    cancelOrder: handleCancel,
    isPending: cancelOrder.isPending,
    error: cancelOrder.error,
  };
}
