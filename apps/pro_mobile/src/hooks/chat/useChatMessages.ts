import { trpc } from "@lib/trpc/client";
import { useSmartPolling } from "../shared/useSmartPolling";

/**
 * Hook to fetch chat messages for an order with cursor pagination and smart polling.
 */
export function useChatMessages(orderId: string | undefined, limit = 30) {
  const pollingOptions = useSmartPolling({
    interval: 5000,
    enabled: !!orderId,
    refetchOnForeground: true,
  });

  const {
    data,
    isLoading,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = trpc.chat.listByOrder.useInfiniteQuery(
    { orderId: orderId ?? "", limit },
    {
      enabled: !!orderId,
      getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
      ...pollingOptions,
    }
  );

  const items = data?.pages.flatMap((p) => p.items) ?? [];
  return {
    items,
    isLoading,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  };
}
