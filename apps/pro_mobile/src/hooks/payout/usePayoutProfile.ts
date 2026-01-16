import { trpc } from "@lib/trpc/client";

/**
 * Hook to fetch the current pro's payout profile
 */
export function usePayoutProfile() {
  return trpc.proPayout.getMine.useQuery(undefined, {
    retry: false,
  });
}
