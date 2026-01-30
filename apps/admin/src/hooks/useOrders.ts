import { trpc } from "@/lib/trpc/client";
import { OrderStatus } from "@repo/domain";

/**
 * Hook to list orders with filters
 *
 * Note: categoryId filter is prepared but not yet supported by backend API.
 * Once backend adds categoryId to adminList input schema, uncomment the categoryId line below.
 */
export function useOrders(filters?: {
  status?: OrderStatus;
  query?: string;
  categoryId?: string;
  limit?: number;
}) {
  return trpc.order.adminList.useQuery({
    status: filters?.status,
    query: filters?.query || undefined,
    // TODO: Uncomment when backend supports categoryId filtering
    // categoryId: filters?.categoryId || undefined,
    limit: filters?.limit || 100,
  });
}

/**
 * Hook to get an order by ID
 */
export function useOrder(orderId: string) {
  return trpc.order.adminGetById.useQuery({ orderId });
}

/**
 * Hook to cancel an order
 */
export function useCancelOrder() {
  return trpc.order.cancel.useMutation();
}

/**
 * Hook to force order status (admin only)
 */
export function useForceOrderStatus() {
  return trpc.order.adminUpdateStatus.useMutation();
}
