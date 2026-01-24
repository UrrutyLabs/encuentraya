import { useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc/client";
import { useAuth } from "./useAuth";
import { useQueryClient } from "../shared";
import type { Role } from "@repo/domain";

/**
 * Hook to fetch current user's role
 * Only fetches when user is authenticated
 * Returns role, loading state, and error
 *
 * Automatically resets query cache when user changes to prevent stale role data.
 * This ensures that when user A signs out and user B signs in, user B gets
 * a fresh query instead of user A's cached role.
 */
export function useUserRole() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const previousUserIdRef = useRef<string | null>(null);

  // Reset query cache when user changes (sign out or different user signs in)
  useEffect(() => {
    const currentUserId = user?.id ?? null;
    const previousUserId = previousUserIdRef.current;

    // If user changed (including sign out), reset the auth.me query cache
    // This prevents showing the previous user's role when a new user signs in
    // The condition covers: different user signs in OR user signs out
    if (previousUserId !== null && previousUserId !== currentUserId) {
      // Reset the query to clear cached data from previous user
      queryClient.resetQueries({
        queryKey: [["auth", "me"]],
      });
    }

    previousUserIdRef.current = currentUserId;
  }, [user?.id, queryClient]);

  const {
    data: userInfo,
    isLoading,
    error,
  } = trpc.auth.me.useQuery(undefined, {
    enabled: !!user, // Only fetch when user is authenticated
    retry: false,
  });

  return {
    role: userInfo?.role as Role | null | undefined,
    isLoading,
    error,
  };
}
