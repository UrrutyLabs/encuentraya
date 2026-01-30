/**
 * Hook for route guards (page-level authentication)
 * Use this in page components or layout components to protect routes
 *
 * This hook handles authentication and role-based access control for routes.
 * It redirects users who are not authenticated or don't have the required role.
 *
 * Network errors are handled by NetworkErrorHandler, not this hook.
 */

import { useEffect, useRef } from "react";
import { useAuthState } from "./useAuthState";
import {
  getRedirectDestination,
  buildRedirectUrl,
} from "@/lib/auth/auth-helpers";
import { isNetworkError } from "@/lib/auth/error-detection";
import { performAuthRedirect } from "@/lib/auth/redirect-helpers";
import type { Role } from "@repo/domain";

export interface UseRouteGuardOptions {
  /**
   * Required role for access (CLIENT, PRO, ADMIN)
   * If provided, only users with matching role can access
   */
  requiredRole?: Role;
  /**
   * Default redirect destination if not authenticated (default: "/login")
   */
  redirectTo?: string;
  /**
   * Return URL to redirect to after authentication
   */
  returnUrl?: string | null;
}

export interface UseRouteGuardReturn {
  /**
   * Whether user is authenticated and has required role (if specified)
   */
  isAuthenticated: boolean;
  /**
   * Whether auth state is loading
   */
  isLoading: boolean;
}

/**
 * Hook to protect routes with authentication and optional role-based access
 *
 * Automatically redirects if:
 * - User is not authenticated
 * - User doesn't have the required role (if specified)
 *
 * Does NOT redirect on network errors (handled by NetworkErrorHandler)
 *
 * @param options - Guard configuration options
 * @returns Auth state and loading state
 *
 * @example
 * ```tsx
 * // Protect route, require CLIENT role
 * function MyJobsPage() {
 *   const { isAuthenticated, isLoading } = useRouteGuard({ requiredRole: Role.CLIENT });
 *
 *   if (isLoading) return <Loading />;
 *   if (!isAuthenticated) return null; // Redirect handled by hook
 *
 *   return <MyJobsContent />;
 * }
 * ```
 */
export function useRouteGuard(
  options: UseRouteGuardOptions = {}
): UseRouteGuardReturn {
  const {
    requiredRole,
    redirectTo: defaultRedirect = "/login",
    returnUrl,
  } = options;
  const authState = useAuthState();
  const hasRedirectedRef = useRef(false);

  useEffect(() => {
    // Still loading, wait
    if (authState.isLoading) {
      return;
    }

    // If we've already redirected, don't redirect again
    if (hasRedirectedRef.current) {
      return;
    }

    // If there's a network error fetching role, don't redirect
    // This prevents redirect loops when the API is down (502, 503, etc.)
    // Network errors are handled by NetworkErrorHandler
    if (authState.roleError && isNetworkError(authState.roleError)) {
      console.warn(
        "[useRouteGuard] Network error fetching role, not redirecting",
        authState.roleError
      );
      return;
    }

    // Not authenticated -> redirect
    if (!authState.isAuthenticated) {
      const destination = getRedirectDestination(
        authState.role,
        requiredRole,
        defaultRedirect
      );
      const url = buildRedirectUrl(destination, returnUrl, defaultRedirect);
      hasRedirectedRef.current = true;
      performAuthRedirect(url);
      return;
    }

    // If role is required, check if it matches
    if (requiredRole) {
      // If role is undefined/null after loading AND there's no network error, treat as mismatch
      if (
        authState.role === undefined ||
        authState.role === null ||
        authState.role !== requiredRole
      ) {
        // Only redirect if we don't have a network error
        // Network errors mean we can't determine the role, so don't redirect
        if (!authState.roleError || !isNetworkError(authState.roleError)) {
          const destination = getRedirectDestination(
            authState.role,
            requiredRole,
            defaultRedirect
          );
          hasRedirectedRef.current = true;
          performAuthRedirect(destination);
        }
        return;
      }
      // Role matches -> allow access
    }
  }, [
    authState.isLoading,
    authState.isAuthenticated,
    authState.role,
    authState.roleError,
    requiredRole,
    defaultRedirect,
    returnUrl,
  ]);

  // Determine if user is authenticated and has correct role
  const isAuthenticated =
    authState.isAuthenticated &&
    (!requiredRole || authState.role === requiredRole);

  return {
    isAuthenticated,
    isLoading: authState.isLoading,
  };
}
