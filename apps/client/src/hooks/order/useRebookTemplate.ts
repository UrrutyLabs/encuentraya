import { trpc } from "@/lib/trpc/client";

/**
 * Hook to fetch order data for rebooking
 * Returns order data needed to prefill a new order form
 * Since there's no dedicated rebookTemplate procedure, we fetch the order directly
 */
export function useRebookTemplate(orderId: string | undefined) {
  return trpc.order.getById.useQuery(
    { id: orderId! },
    {
      enabled: !!orderId,
      retry: false,
    }
  );
}
