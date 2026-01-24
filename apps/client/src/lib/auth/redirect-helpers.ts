/**
 * Authentication redirect helpers
 * Functions to handle navigation/redirection for authentication flows
 * Abstracts Next.js router implementation
 */

/**
 * Performs an authentication redirect to a URL
 * Uses window.location.assign for full page reload to clear stale state
 *
 * @param url - The URL to redirect to
 */
export function performAuthRedirect(url: string): void {
  if (typeof window === "undefined") {
    return;
  }

  // Prevent redirect loops - don't redirect if already on the target page
  if (window.location.pathname === url.split("?")[0]) {
    return;
  }

  console.warn("[Auth Redirect] Redirecting to", url);
  window.location.assign(url);
}

/**
 * Redirects to the login page
 * Convenience function for authentication redirects to login
 *
 * @param returnUrl - Optional return URL to append as query parameter
 */
export function redirectToLoginPage(returnUrl?: string | null): void {
  const url = returnUrl
    ? `/login?returnUrl=${encodeURIComponent(returnUrl)}`
    : "/login";
  performAuthRedirect(url);
}
