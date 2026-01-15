import { useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./useAuth";

interface UseRequireAuthOptions {
  redirectTo?: string;
  returnUrl?: string;
}

interface UseRequireAuthReturn {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: ReturnType<typeof useAuth>["user"];
  requireAuth: <T extends unknown[]>(callback: (...args: T) => void) => (...args: T) => void;
}

/**
 * Hook to require authentication for protected routes or actions
 * 
 * @param options - Configuration options
 * @param options.redirectTo - Where to redirect if not authenticated (default: '/login')
 * @param options.returnUrl - URL to return to after authentication
 * @returns Auth state and requireAuth wrapper function
 */
export function useRequireAuth(options: UseRequireAuthOptions = {}): UseRequireAuthReturn {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { redirectTo = "/login", returnUrl } = options;

  // Build redirect URL with returnUrl if provided
  const redirectUrl = useMemo(() => {
    if (returnUrl) {
      return `${redirectTo}?returnUrl=${encodeURIComponent(returnUrl)}`;
    }
    return redirectTo;
  }, [redirectTo, returnUrl]);

  // Redirect immediately when not authenticated (after loading completes)
  useEffect(() => {
    if (!loading && !user) {
      router.push(redirectUrl);
    }
  }, [loading, user, router, redirectUrl]);

  /**
   * Wraps a callback function to require authentication before execution
   * If not authenticated, redirects immediately
   */
  const requireAuth = useCallback(
    <T extends unknown[]>(callback: (...args: T) => void) => {
      return (...args: T) => {
        if (loading) {
          // Still loading, wait
          return;
        }
        if (!user) {
          // Not authenticated, redirect immediately
          router.push(redirectUrl);
          return;
        }
        // Authenticated, execute callback
        callback(...args);
      };
    },
    [user, loading, router, redirectUrl]
  );

  return {
    isAuthenticated: !!user,
    isLoading: loading,
    user,
    requireAuth,
  };
}
