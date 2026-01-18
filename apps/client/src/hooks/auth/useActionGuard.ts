/**
 * Hook for action guards (callback protection)
 * Use this to protect callbacks, button clicks, etc. that require authentication
 * 
 * Returns a wrapper function that checks authentication before executing the callback.
 * If not authenticated or wrong role, redirects instead of executing.
 */

import { useCallback } from "react";
import { useAuthState } from "./useAuthState";
import { getRedirectDestination, buildRedirectUrl } from "@/lib/auth/auth-helpers";
import { performAuthRedirect } from "@/lib/auth/redirect-helpers";
import type { Role } from "@repo/domain";

export interface UseActionGuardOptions {
  /**
   * Required role for the action (CLIENT, PRO, ADMIN)
   * If provided, only users with matching role can execute
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

/**
 * Hook to protect actions (callbacks) with authentication and optional role-based access
 * 
 * Returns a wrapper function that:
 * - Checks authentication before executing
 * - Checks role if requiredRole is specified
 * - Redirects if not authenticated or wrong role
 * - Executes callback if authenticated and has correct role
 * 
 * @param options - Guard configuration options
 * @returns Wrapper function that protects callbacks
 * 
 * @example
 * ```tsx
 * // Protect a button click
 * function CreateBookingButton() {
 *   const requireAuth = useActionGuard({ requiredRole: Role.CLIENT });
 *   
 *   const handleClick = requireAuth(() => {
 *     // This only executes if user is authenticated and has CLIENT role
 *     createBooking();
 *   });
 *   
 *   return <Button onClick={handleClick}>Crear reserva</Button>;
 * }
 * ```
 */
export function useActionGuard(
  options: UseActionGuardOptions = {}
): <T extends unknown[]>(callback: (...args: T) => void) => (...args: T) => void {
  const { requiredRole, redirectTo: defaultRedirect = "/login", returnUrl } = options;
  const authState = useAuthState();

  return useCallback(
    <T extends unknown[]>(callback: (...args: T) => void) => {
      return (...args: T) => {
        // Still loading, wait
        if (authState.isLoading) {
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
          performAuthRedirect(url);
          return;
        }

        // Check role if required
        if (requiredRole) {
          if (authState.role !== requiredRole) {
            // Wrong role, redirect
            const destination = getRedirectDestination(
              authState.role,
              requiredRole,
              defaultRedirect
            );
            performAuthRedirect(destination);
            return;
          }
        }

        // Authenticated and correct role, execute callback
        callback(...args);
      };
    },
    [
      authState.isLoading,
      authState.isAuthenticated,
      authState.role,
      requiredRole,
      defaultRedirect,
      returnUrl,
    ]
  );
}
