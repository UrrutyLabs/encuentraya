import { trpc } from "@lib/trpc/client";

/**
 * Hook to fetch payout history for the current pro
 */
export function usePayouts(options?: { limit?: number; offset?: number }) {
  return trpc.proPayout.getMinePayouts.useQuery(
    { limit: options?.limit, offset: options?.offset },
    {
      retry: false,
    }
  );
}
