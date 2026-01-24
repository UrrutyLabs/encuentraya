/**
 * Error detection helpers
 * Pure functions to detect different types of errors (network, auth, etc.)
 */

/**
 * Detects if an error is a network/server error (not auth error)
 * Used to prevent redirect loops when API is down (502, 503, CORS, etc.)
 *
 * @param error - The error to check
 * @returns true if the error is a network/server error
 */
export function isNetworkError(error: unknown): boolean {
  if (!error) return false;

  // Check for network error messages
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    if (
      message.includes("failed to fetch") ||
      message.includes("networkerror") ||
      message.includes("cors") ||
      message.includes("network request failed")
    ) {
      return true;
    }
  }

  // Check if it's a tRPC error with 5xx status
  if (typeof error === "object" && error !== null && "data" in error) {
    const data = (error as { data?: { httpStatus?: number } }).data;
    if (data?.httpStatus && data.httpStatus >= 500 && data.httpStatus < 600) {
      return true;
    }
  }

  // Check if it's a Response object with 5xx status
  if (error instanceof Response) {
    if (error.status >= 500 && error.status < 600) {
      return true;
    }
  }

  return false;
}

/**
 * Detects if an error is an authentication error (401)
 *
 * @param error - The error to check
 * @returns true if the error is an auth error
 */
export function isAuthError(error: unknown): boolean {
  if (!error) return false;

  // Check if it's a tRPC error with 401 status
  if (typeof error === "object" && error !== null && "data" in error) {
    const data = (error as { data?: { httpStatus?: number } }).data;
    if (data?.httpStatus === 401) {
      return true;
    }
  }

  // Check if it's a Response object with 401 status
  if (error instanceof Response) {
    if (error.status === 401) {
      return true;
    }
  }

  return false;
}
