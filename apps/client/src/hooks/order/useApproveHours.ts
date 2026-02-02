import { trpc } from "@/lib/trpc/client";
import { logger } from "@/lib/logger";
import { useQueryClient } from "../shared";
import { invalidateRelatedQueries } from "@/lib/react-query/utils";

/**
 * Hook to approve hours (hourly) or confirm completion (fixed).
 * Calls order.approveHours; backend uses quotedAmountCents for fixed.
 * Invalidates order.getById so job detail refetches.
 */
export function useApproveHours(orderId: string | undefined) {
  const queryClient = useQueryClient();

  const approveHours = trpc.order.approveHours.useMutation({
    ...invalidateRelatedQueries(queryClient, [
      ...(orderId
        ? [
            [["order", "getById"], { id: orderId }],
            [["order", "listByClient"]],
            [["payment", "getByOrder"]],
          ]
        : []),
    ]),
  });

  const handleApproveHours = async () => {
    if (!orderId) return;
    try {
      await approveHours.mutateAsync({ orderId });
    } catch (error) {
      logger.error(
        "Error approving hours",
        error instanceof Error ? error : new Error(String(error)),
        { orderId }
      );
      throw error;
    }
  };

  return {
    approveHours: handleApproveHours,
    isPending: approveHours.isPending,
    error: approveHours.error,
  };
}
