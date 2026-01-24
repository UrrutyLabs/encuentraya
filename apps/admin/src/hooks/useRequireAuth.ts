"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./useAuth";

interface UseRequireAuthOptions {
  redirectTo?: string;
}

interface UseRequireAuthReturn {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: ReturnType<typeof useAuth>["user"];
}

/**
 * Simple hook to require authentication
 * Redirects to login if not authenticated
 *
 * @param options - Configuration options
 * @param options.redirectTo - Where to redirect if not authenticated (default: '/login')
 * @returns Auth state
 */
export function useRequireAuth(
  options: UseRequireAuthOptions = {}
): UseRequireAuthReturn {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { redirectTo = "/login" } = options;

  // Redirect immediately when not authenticated (after loading completes)
  useEffect(() => {
    if (!loading && !user) {
      router.push(redirectTo);
    }
  }, [loading, user, router, redirectTo]);

  return {
    isAuthenticated: !!user,
    isLoading: loading,
    user,
  };
}
