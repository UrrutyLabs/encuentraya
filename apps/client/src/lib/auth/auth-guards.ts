/**
 * Auth guard utilities for handling 401 errors and auth invalidation
 * Centralized logic for network layer and Supabase auth events
 */

import { supabase } from "@/lib/supabase/client";
import { clearSessionStorage } from "@/lib/supabase/auth-utils";
import { redirectToLoginPage } from "./redirect-helpers";

/**
 * @deprecated Use redirectToLoginPage() from redirect-helpers instead
 * Redirect to login page if not already there
 * Uses window.location.assign to ensure a full page reload and clear any stale state
 */
export function redirectToLogin(): void {
  redirectToLoginPage();
}

/**
 * Sign out locally (current device only) and redirect to login
 * This clears the session without affecting other devices
 */
export async function signOutAndRedirect(): Promise<void> {
  try {
    // Sign out locally (current device only)
    await supabase.auth.signOut({ scope: "local" });
  } catch (err) {
    // Even if signOut fails, clear localStorage and redirect
    console.warn("[Auth Guard] signOut failed, clearing storage", err);
  }

  // Always clear localStorage as fallback
  await clearSessionStorage();

  // Redirect to login
  redirectToLogin();
}

import type { Session } from "@supabase/supabase-js";
import type { AuthError } from "@supabase/supabase-js";

/**
 * Mutex to ensure only one refresh attempt runs at a time
 * Prevents parallel requests from spamming refresh calls
 */
let refreshPromise: Promise<{ session: Session | null; error: AuthError | Error | null }> | null = null;

/**
 * Attempt to refresh the session
 * Returns the refreshed session or null if refresh failed
 * Uses a mutex to prevent concurrent refresh attempts
 */
async function attemptRefresh(): Promise<{ session: Session | null; error: AuthError | Error | null }> {
  // If a refresh is already in progress, wait for it
  if (refreshPromise) {
    return refreshPromise;
  }

  // Start a new refresh attempt
  const promise = (async (): Promise<{ session: Session | null; error: AuthError | Error | null }> => {
    try {
      // Get current session to trigger refresh if needed
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !sessionData.session) {
        return { session: null, error: sessionError || new Error("No session") };
      }

      // Try to refresh the session
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();

      if (refreshError || !refreshData.session) {
        return { session: null, error: refreshError || new Error("Refresh failed") };
      }

      return { session: refreshData.session, error: null };
    } catch (err) {
      // Ensure error is properly typed - AuthError extends Error, so instanceof Error covers both
      const error: Error = err instanceof Error ? err : new Error(String(err));
      return { session: null, error };
    } finally {
      // Clear the promise so future requests can retry
      refreshPromise = null;
    }
  })();

  refreshPromise = promise;
  return promise;
}

/**
 * Custom fetch wrapper that handles 401 errors
 * - Intercepts 401 responses
 * - Attempts to refresh the session once
 * - Retries the request with new token
 * - Signs out and redirects if refresh fails or second request still returns 401
 * - Does NOT sign out for server errors (5xx) or network errors
 */
export function createAuthFetch(originalFetch: typeof fetch): typeof fetch {
  return async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    try {
      // Make the initial request
      const response = await originalFetch(input, init);

      // Handle server errors (5xx) - do NOT sign out, just return the error
      // These are temporary server issues, not authentication problems
      if (response.status >= 500 && response.status < 600) {
        console.warn("[Auth Guard] Server error (5xx), not signing out", {
          status: response.status,
          url: typeof input === "string" ? input : input instanceof URL ? input.href : input.url,
        });
        return response;
      }

      // If not a 401, return the response as-is
      if (response.status !== 401) {
        return response;
      }

    // Got a 401 - attempt to refresh
    console.warn("[Auth Guard] Received 401, attempting session refresh");

    const refreshResult = await attemptRefresh();

    if (!refreshResult || refreshResult.error || !refreshResult.session) {
      // Refresh failed - sign out and redirect
      console.warn("[Auth Guard] Session refresh failed, signing out", refreshResult?.error);
      await signOutAndRedirect();
      return response; // Return the original 401 response
    }

    // Refresh succeeded - retry the request with new token
    console.warn("[Auth Guard] Session refreshed, retrying request");

    // Clone the original request init to retry
    const retryInit: RequestInit = {
      ...init,
      headers: {
        ...init?.headers,
        Authorization: `Bearer ${refreshResult.session.access_token}`,
      },
    };

    const retryResponse = await originalFetch(input, retryInit);

      // If retry still returns 401, sign out and redirect
      if (retryResponse.status === 401) {
        console.warn("[Auth Guard] Retry still returned 401, signing out");
        await signOutAndRedirect();
      }

      return retryResponse;
    } catch (error) {
      // Network errors (CORS, timeout, etc.) - do NOT sign out
      // These are connectivity issues, not authentication problems
      console.warn("[Auth Guard] Network error, not signing out", {
        error: error instanceof Error ? error.message : String(error),
        url: typeof input === "string" ? input : input instanceof URL ? input.href : input.url,
      });
      // Re-throw to let React Query handle it
      throw error;
    }
  };
}
