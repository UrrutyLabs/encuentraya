import { trpc } from "@lib/trpc/client";
import { useSmartPolling } from "../shared/useSmartPolling";
import { useAuth } from "../auth/useAuth";
import { OrderStatus, type Order } from "@repo/domain";
import { useMemo } from "react";

/**
 * Hook to fetch pro jobs (accepted, in_progress, completed)
 * Filters orders from listByPro to show accepted, in_progress, and completed statuses
 * Encapsulates the order.listByPro query with smart polling
 * Only fetches when user is authenticated
 * Note: UI displays these as "Jobs" (Trabajos) to users
 */
export function useProJobs() {
  const { user } = useAuth();

  // Smart polling: pauses when app is in background, resumes in foreground
  const pollingOptions = useSmartPolling({
    interval: 10000, // Poll every 10 seconds when in foreground
    enabled: !!user, // Only poll when user is authenticated
    refetchOnForeground: true,
  });

  const {
    data: orders = [],
    isLoading,
    error,
  } = trpc.order.listByPro.useQuery(undefined, {
    enabled: !!user, // Only fetch when user is authenticated
    retry: false,
    ...pollingOptions, // Spread smart polling options
  });

  // Filter orders for jobs: accepted, in_progress, and completed
  const jobOrders = useMemo(() => {
    return orders.filter(
      (order: Order) =>
        order.status === OrderStatus.ACCEPTED ||
        order.status === OrderStatus.IN_PROGRESS ||
        order.status === OrderStatus.COMPLETED
    );
  }, [orders]);

  return {
    orders: jobOrders,
    isLoading,
    error,
  };
}
