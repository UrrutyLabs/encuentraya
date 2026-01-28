import { useMemo } from "react";
import { trpc } from "@/lib/trpc/client";
import { useAuth } from "../auth";
import { useSmartPolling } from "../shared";
import { OrderStatus } from "@repo/domain";

export function useMyOrders() {
  const { user } = useAuth();

  // Smart polling: pauses when page is hidden, resumes when visible
  const pollingOptions = useSmartPolling({
    interval: 10000, // Poll every 10 seconds when page is visible
    enabled: !!user,
    refetchOnForeground: true,
  });

  const {
    data: orders,
    isLoading,
    error,
  } = trpc.order.listByClient.useQuery(undefined, {
    enabled: !!user,
    retry: false,
    ...pollingOptions, // Spread smart polling options
  });

  // Get order IDs for completed orders
  const completedOrderIds = useMemo(() => {
    if (!orders) return [];
    return orders
      .filter((o) => o.status === OrderStatus.COMPLETED)
      .map((o) => o.id);
  }, [orders]);

  // Fetch review status for completed orders
  const { data: reviewStatusMap = {} } = trpc.review.statusByOrderIds.useQuery(
    { orderIds: completedOrderIds },
    {
      enabled: completedOrderIds.length > 0 && !!user,
      retry: false,
    }
  );

  return {
    orders: orders ?? [],
    isLoading,
    error,
    reviewStatusMap,
  };
}
