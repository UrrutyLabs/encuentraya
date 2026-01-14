import { trpc } from "@/lib/trpc/client";

/**
 * Hook to list failed notifications
 */
export function useFailedNotifications(limit?: number) {
  return trpc.notification.listFailed.useQuery({ limit });
}

/**
 * Hook to retry failed notifications
 */
export function useRetryFailed() {
  return trpc.notification.retryFailed.useMutation();
}

/**
 * Hook to drain queued notifications
 */
export function useDrainQueued() {
  return trpc.notification.drainQueued.useMutation();
}
