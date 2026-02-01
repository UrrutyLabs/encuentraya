import { trpc } from "@lib/trpc/client";

/**
 * Hook to fetch the current pro's own profile
 */
export function useMyProProfile() {
  return trpc.pro.getMyProfile.useQuery(undefined, {
    retry: false,
  });
}
