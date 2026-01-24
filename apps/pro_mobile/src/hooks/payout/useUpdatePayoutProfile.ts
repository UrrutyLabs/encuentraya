import { trpc } from "@lib/trpc/client";
import { useQueryClient } from "../shared";

/**
 * Hook to update the current pro's payout profile
 */
export function useUpdatePayoutProfile() {
  const queryClient = useQueryClient();

  return trpc.proPayout.updateMine.useMutation({
    onSuccess: () => {
      // Invalidate queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: [["proPayout", "getMine"]] });
      queryClient.invalidateQueries({
        queryKey: [["proPayout", "getSummary"]],
      });
      queryClient.invalidateQueries({ queryKey: [["pro", "getMyProfile"]] });
    },
  });
}
