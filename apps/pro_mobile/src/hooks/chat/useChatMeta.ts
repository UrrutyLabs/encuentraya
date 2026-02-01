import { trpc } from "@lib/trpc/client";

/**
 * Hook to get unread count and whether chat is open for an order.
 */
export function useChatMeta(orderId: string | undefined) {
  const { data: unreadCount = 0 } = trpc.chat.unreadCount.useQuery(
    { orderId: orderId ?? "" },
    { enabled: !!orderId }
  );

  const { data: isChatOpen = false } = trpc.chat.isChatOpen.useQuery(
    { orderId: orderId ?? "" },
    { enabled: !!orderId }
  );

  return { unreadCount, isChatOpen };
}
