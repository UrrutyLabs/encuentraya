import { trpc } from "@lib/trpc/client";

/**
 * Hook to send a chat message and invalidate the messages list.
 */
export function useSendMessage(orderId: string | undefined) {
  const utils = trpc.useUtils();

  const mutation = trpc.chat.send.useMutation({
    onSuccess: () => {
      utils.chat.listByOrder.invalidate({ orderId: orderId ?? "" });
    },
  });

  return {
    sendMessage: mutation.mutateAsync,
    isSending: mutation.isPending,
    error: mutation.error,
  };
}
