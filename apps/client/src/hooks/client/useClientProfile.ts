import { trpc } from "@/lib/trpc/client";

export interface UseClientProfileOptions {
  /** When false, the query is not run. Use when user may not be a client (e.g. nav). */
  enabled?: boolean;
}

/**
 * Hook to fetch current user's client profile
 * Encapsulates the clientProfile.get query
 */
export function useClientProfile(options?: UseClientProfileOptions) {
  const enabled = options?.enabled ?? true;
  const {
    data: profile,
    isLoading,
    error,
  } = trpc.clientProfile.get.useQuery(undefined, {
    retry: false,
    enabled,
  });

  return {
    profile,
    isLoading,
    error,
  };
}
