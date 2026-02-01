import { useCallback } from "react";
import { trpc } from "@lib/trpc/client";

/**
 * Hook to mark chat as read for an order and invalidate unread count.
 */
export function useMarkRead(orderId: string | undefined) {
  const utils = trpc.useUtils();

  const mutation = trpc.chat.markRead.useMutation({
    onSuccess: () => {
      utils.chat.unreadCount.invalidate({ orderId: orderId ?? "" });
    },
  });

  const markRead = useCallback(() => {
    mutation.mutate({ orderId: orderId ?? "" });
  }, [mutation, orderId]);

  return {
    markRead,
    isMarking: mutation.isPending,
  };
}
