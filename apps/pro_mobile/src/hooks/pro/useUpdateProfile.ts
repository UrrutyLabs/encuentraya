import { trpc } from "@lib/trpc/client";
import { useQueryClient } from "@hooks/shared";
import { invalidateRelatedQueries } from "@lib/react-query/utils";

/**
 * Hook to update the current pro's profile
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return trpc.pro.updateProfile.useMutation({
    ...invalidateRelatedQueries(queryClient, [
      [["pro", "getMyProfile"]],
      [["pro", "getById"]],
    ]),
  });
}
