import { trpc } from "@lib/trpc/client";
import { useSmartPolling } from "../shared/useSmartPolling";
import { useAuth } from "../auth/useAuth";
import { OrderStatus, type Order } from "@repo/domain";
import { useMemo } from "react";

/**
 * Hook to fetch pro inbox orders (pending and accepted)
 * Filters orders from listByPro to show pending_pro_confirmation and accepted statuses
 * Encapsulates the order.listByPro query with smart polling
 * Only fetches when user is authenticated
 * Note: UI displays these as "Jobs" (Trabajos) to users
 */
export function useProInbox() {
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

  // Filter orders for inbox: pending_pro_confirmation and accepted
  const inboxOrders = useMemo(() => {
    return orders.filter(
      (order: Order) =>
        order.status === OrderStatus.PENDING_PRO_CONFIRMATION ||
        order.status === OrderStatus.ACCEPTED
    );
  }, [orders]);

  return {
    orders: inboxOrders,
    isLoading,
    error,
  };
}
