import type { Session } from "@supabase/supabase-js";
import { supabase } from "./client";
import { logger } from "../crash-reporting";

/**
 * Decode JWT token to check expiration
 * @param token - JWT token string
 * @returns expiration timestamp in seconds, or null if invalid
 */
export function getTokenExpiration(token: string | undefined): number | null {
  if (!token) {
    return null;
  }

  try {
    // JWT tokens have 3 parts: header.payload.signature
    const parts = token.split(".");
    if (parts.length !== 3) {
      return null;
    }

    // Decode the payload (second part)
    const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
    
    // Return expiration time (exp claim is in seconds)
    return payload.exp || null;
  } catch (err) {
    logger.error("Error decoding JWT token", err instanceof Error ? err : new Error(String(err)));
    return null;
  }
}

/**
 * Check if a Supabase session is expired
 * @param session - The session to check
 * @returns true if session is expired or invalid, false otherwise
 */
export function isSessionExpired(session: Session | null): boolean {
  if (!session) {
    return true;
  }

  // First, try to decode the JWT token to check its actual expiration
  const tokenExp = getTokenExpiration(session.access_token);
  if (tokenExp) {
    const currentTime = Math.floor(Date.now() / 1000);
    if (tokenExp < currentTime) {
      logger.info("Session expired (JWT token expired)", {
        tokenExp,
        currentTime,
        expires_at: session.expires_at,
      });
      return true;
    }
  }

  // Fallback: Check expires_at if available (Unix timestamp in seconds)
  if (session.expires_at) {
    const currentTime = Math.floor(Date.now() / 1000);
    if (session.expires_at < currentTime) {
      logger.info("Session expired (expires_at)", {
        expires_at: session.expires_at,
        currentTime,
      });
      return true;
    }
  }

  return false;
}

/**
 * Clear Supabase session from localStorage
 * This works even when signOut() fails due to invalid session
 */
export async function clearSessionStorage(): Promise<void> {
  if (typeof window === "undefined" || !window.localStorage) {
    return;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    return;
  }

  // Extract project ref from URL (e.g., https://xyz.supabase.co -> xyz)
  const projectRef = supabaseUrl.match(/https?:\/\/([^.]+)\.supabase\.co/)?.[1];
  if (projectRef) {
    const storageKey = `sb-${projectRef}-auth-token`;
    window.localStorage.removeItem(storageKey);
    logger.info("Cleared expired Supabase session from localStorage", { key: storageKey });
  }

  // Also clear any other potential Supabase keys
  const keysToRemove: string[] = [];
  for (let i = 0; i < window.localStorage.length; i++) {
    const key = window.localStorage.key(i);
    if (key && (key.includes("supabase") || key.includes("sb-"))) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach((key) => {
    window.localStorage.removeItem(key);
  });
}

/**
 * Validate and refresh a Supabase session
 * @param session - The session to validate
 * @returns Valid session or null if invalid/expired
 */
export async function validateAndRefreshSession(session: Session | null): Promise<Session | null> {
  if (!session) {
    return null;
  }

  // Check if session appears expired before refreshing
  const isExpired = isSessionExpired(session);
  
  if (isExpired) {
    logger.info("Session appears expired, attempting refresh", {
      expires_at: session.expires_at,
      tokenExp: getTokenExpiration(session.access_token),
    });
  }

  // Always try refreshSession() - it will validate the refresh token
  // If refresh token is invalid/expired, it will fail
  try {
    const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
    
    if (refreshError) {
      // Refresh failed - session is invalid
      logger.info("Session refresh failed, clearing", { 
        error: refreshError,
        errorMessage: refreshError.message,
      });
      await clearSessionStorage();
      return null;
    }

    if (!refreshData.session) {
      // No session returned after refresh
      logger.info("No session returned after refresh, clearing");
      await clearSessionStorage();
      return null;
    }

    // Validate the refreshed session
    const refreshedIsExpired = isSessionExpired(refreshData.session);
    if (refreshedIsExpired) {
      logger.info("Refreshed session still expired, clearing");
      await clearSessionStorage();
      return null;
    }

    // Session is valid
    logger.info("Session refreshed and valid");
    return refreshData.session;
  } catch (err) {
    // Refresh threw an error - clear session
    logger.info("Session refresh threw error, clearing", { error: err });
    await clearSessionStorage();
    return null;
  }
}
