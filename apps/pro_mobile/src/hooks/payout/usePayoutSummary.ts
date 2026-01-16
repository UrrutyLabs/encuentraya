import { trpc } from "@lib/trpc/client";

/**
 * Hook to fetch financial summary for the current pro
 */
export function usePayoutSummary() {
  return trpc.proPayout.getSummary.useQuery(undefined, {
    retry: false,
  });
}
