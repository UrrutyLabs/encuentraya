import { trpc } from "@lib/trpc/client";

/**
 * Hook to fetch earnings history for the current pro
 */
export function useEarnings(options?: {
  status?: "PENDING" | "PAYABLE" | "PAID" | "REVERSED";
  limit?: number;
  offset?: number;
}) {
  return trpc.proPayout.getMineEarnings.useQuery(
    {
      status: options?.status,
      limit: options?.limit,
      offset: options?.offset,
    },
    {
      retry: false,
    }
  );
}
