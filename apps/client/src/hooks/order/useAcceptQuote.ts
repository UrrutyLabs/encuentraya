import { trpc } from "@/lib/trpc/client";
import { logger } from "@/lib/logger";
import { useQueryClient } from "../shared";
import { invalidateRelatedQueries } from "@/lib/react-query/utils";

/**
 * Hook to accept a pro's quote (fixed-price orders).
 * Calls order.acceptQuote; invalidates order.getById so job detail refetches.
 */
export function useAcceptQuote(orderId: string | undefined) {
  const queryClient = useQueryClient();

  const acceptQuote = trpc.order.acceptQuote.useMutation({
    ...invalidateRelatedQueries(queryClient, [
      ...(orderId
        ? [[["order", "getById"], { id: orderId }], [["payment", "getByOrder"]]]
        : []),
    ]),
  });

  const handleAcceptQuote = async () => {
    if (!orderId) return;
    try {
      await acceptQuote.mutateAsync({ orderId });
    } catch (error) {
      logger.error(
        "Error accepting quote",
        error instanceof Error ? error : new Error(String(error)),
        { orderId }
      );
      throw error;
    }
  };

  return {
    acceptQuote: handleAcceptQuote,
    isPending: acceptQuote.isPending,
    error: acceptQuote.error,
  };
}
