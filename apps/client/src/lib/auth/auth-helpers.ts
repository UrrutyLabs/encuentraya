/**
 * Authentication helpers
 * Pure functions for authentication and role-based access logic
 */

import { Role } from "@repo/domain";

/**
 * Determines if a user has access based on their role
 *
 * @param userRole - The user's current role (or null/undefined)
 * @param requiredRole - The role required for access
 * @returns true if user has the required role
 */
export function hasRoleAccess(
  userRole: Role | null | undefined,
  requiredRole: Role
): boolean {
  return userRole === requiredRole;
}

/**
 * Determines the redirect destination based on role mismatch
 * Handles cases where:
 * - PRO user tries to access CLIENT route -> redirect to /pro/download-app
 * - CLIENT user tries to access PRO route -> redirect to /my-bookings
 * - No role requirement -> use default redirect
 *
 * @param userRole - The user's current role (or null/undefined)
 * @param requiredRole - The role required for the route (optional)
 * @param defaultRedirect - Default redirect destination (default: "/login")
 * @returns The redirect destination URL
 */
export function getRedirectDestination(
  userRole: Role | null | undefined,
  requiredRole?: Role,
  defaultRedirect = "/login"
): string {
  // If no role requirement, use default redirect
  if (!requiredRole) {
    return defaultRedirect;
  }

  // If user has a role but it doesn't match required role, handle mismatch
  if (userRole) {
    // PRO user trying to access CLIENT route -> redirect to download app
    if (requiredRole === Role.CLIENT && userRole === Role.PRO) {
      return "/pro/download-app";
    }

    // CLIENT user trying to access PRO route -> redirect to my-bookings
    if (requiredRole === Role.PRO && userRole === Role.CLIENT) {
      return "/my-bookings";
    }
  }

  // Default redirect (not authenticated or role matches)
  return defaultRedirect;
}

/**
 * Builds a redirect URL with optional returnUrl query parameter
 *
 * @param destination - The base destination URL
 * @param returnUrl - Optional return URL to append as query parameter
 * @param defaultRedirect - Default redirect if destination matches this (prevents adding returnUrl to role-based redirects)
 * @returns The complete redirect URL with returnUrl if applicable
 */
export function buildRedirectUrl(
  destination: string,
  returnUrl?: string | null,
  defaultRedirect = "/login"
): string {
  // Only add returnUrl for default login redirect, not role-based redirects
  if (returnUrl && destination === defaultRedirect) {
    return `${destination}?returnUrl=${encodeURIComponent(returnUrl)}`;
  }
  return destination;
}
