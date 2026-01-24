import { httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import { supabase } from "@/lib/supabase/client";
import { createAuthFetch } from "@/lib/auth/auth-guards";
import { getApiUrl } from "@/lib/env";

const getBaseUrl = () => {
  try {
    return getApiUrl();
  } catch (error) {
    // In development, allow fallback to localhost
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[tRPC] Environment detection failed, using localhost fallback:",
        error
      );
      return "http://localhost:3002";
    }
    // In production/preview, re-throw the error
    throw error;
  }
};

export function createTRPCLinks() {
  // Create custom fetch wrapper that handles 401 errors
  const authFetch = createAuthFetch(fetch);

  return [
    httpBatchLink({
      url: `${getBaseUrl()}/api/trpc`,
      transformer: superjson,
      fetch: authFetch, // Use custom fetch wrapper for 401 handling
      headers: async () => {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const headers: Record<string, string> = {};
        if (session?.access_token) {
          headers.Authorization = `Bearer ${session.access_token}`;
        }
        return headers;
      },
    }),
  ];
}
