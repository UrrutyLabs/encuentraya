import { trpc } from "@lib/trpc/client";
import { useSmartPolling } from "../shared/useSmartPolling";

/**
 * Hook to fetch order details by ID
 * Encapsulates the order.getById query with smart polling
 * Note: UI displays this as "Job" (Trabajo) to users
 */
export function useOrderDetail(orderId: string | undefined) {
  // Smart polling: pauses when app is in background, resumes in foreground
  const pollingOptions = useSmartPolling({
    interval: 5000, // Poll every 5 seconds when in foreground (more frequent for detail view)
    enabled: !!orderId,
    refetchOnForeground: true,
  });

  const {
    data: order,
    isLoading,
    error,
    refetch,
  } = trpc.order.getById.useQuery(
    { id: orderId || "" },
    {
      enabled: !!orderId,
      retry: false,
      ...pollingOptions, // Spread smart polling options
    }
  );

  return {
    order,
    isLoading,
    error,
    refetch,
  };
}
