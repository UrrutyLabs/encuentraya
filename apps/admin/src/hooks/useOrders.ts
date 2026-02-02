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
 * Hook to get audit logs for an order (e.g. contact info blocked, status forced).
 * Use when showing order detail to admin.
 */
export function useOrderAuditLogs(
  orderId: string,
  options?: { enabled?: boolean }
) {
  return trpc.audit.getResourceLogs.useQuery(
    { resourceType: "Order", resourceId: orderId },
    { enabled: options?.enabled ?? true }
  );
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

/**
 * Hook to list chat messages for an order (admin only)
 */
export function useOrderChat(orderId: string, options?: { enabled?: boolean }) {
  return trpc.chat.adminListByOrder.useQuery(
    { orderId, limit: 100 },
    { enabled: (options?.enabled ?? true) && !!orderId }
  );
}
