import { httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import { supabase } from "@/lib/supabase/client";
import { createAuthFetch } from "@/lib/auth/auth-guards";

const getBaseUrl = () => {
  // Always use the full API URL, even in browser
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
  return "http://localhost:3002"; // API server port
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
