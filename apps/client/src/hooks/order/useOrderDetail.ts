import { trpc } from "@/lib/trpc/client";
import { useSmartPolling } from "../shared";
import { OrderStatus } from "@repo/domain";

export function useOrderDetail(orderId: string | undefined) {
  // Smart polling: pauses when page is hidden, resumes when visible
  const pollingOptions = useSmartPolling({
    interval: 5000, // Poll every 5 seconds when page is visible (more frequent for detail view)
    enabled: !!orderId,
    refetchOnForeground: true,
  });

  // Fetch order by id with smart polling
  const orderQuery = trpc.order.getById.useQuery(
    { id: orderId || "" },
    {
      enabled: !!orderId,
      retry: false,
      ...pollingOptions, // Spread smart polling options
    }
  );
  const order = orderQuery?.data;
  const isLoading = orderQuery?.isLoading ?? false;
  const error = orderQuery?.error;
  const refetch = orderQuery?.refetch;

  // Fetch pro details conditionally
  const proQuery = trpc.pro.getById.useQuery(
    { id: order?.proProfileId ?? "" },
    {
      enabled: !!order?.proProfileId,
      retry: false,
    }
  );
  const pro = proQuery?.data;

  // Fetch existing review for this order (only if completed)
  const reviewQuery = trpc.review.byOrder.useQuery(
    { orderId: orderId || "" },
    {
      enabled: !!orderId && order?.status === OrderStatus.COMPLETED,
      retry: false,
    }
  );
  const existingReview = reviewQuery?.data;

  // Fetch payment info for orders that need payment authorization
  // Check for orders in states that might need payment (confirmed, in_progress, etc.)
  const needsPayment =
    order &&
    (order.status === OrderStatus.CONFIRMED ||
      order.status === OrderStatus.IN_PROGRESS ||
      order.status === OrderStatus.AWAITING_CLIENT_APPROVAL);
  const paymentQuery = trpc.payment.getByOrder.useQuery(
    { orderId: orderId || "" },
    {
      enabled: !!orderId && !!needsPayment,
      retry: false,
    }
  );
  const payment = paymentQuery?.data;

  return {
    order,
    pro,
    existingReview,
    payment,
    isLoading,
    error,
    refetch,
  };
}
