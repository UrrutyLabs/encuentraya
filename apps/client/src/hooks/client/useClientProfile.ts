import { trpc } from "@/lib/trpc/client";

/**
 * Hook to fetch current user's client profile
 * Encapsulates the clientProfile.get query
 */
export function useClientProfile() {
  const {
    data: profile,
    isLoading,
    error,
  } = trpc.clientProfile.get.useQuery(undefined, {
    retry: false,
  });

  return {
    profile,
    isLoading,
    error,
  };
}
