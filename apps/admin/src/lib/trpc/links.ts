import { httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import { supabase } from "@/lib/supabase/client";
import { getApiUrl } from "@/lib/env";

const getBaseUrl = () => {
  try {
    return getApiUrl();
  } catch (error) {
    // In development, allow fallback to localhost
    if (process.env.NODE_ENV === "development") {
      console.warn("[tRPC] Environment detection failed, using localhost fallback:", error);
      return "http://localhost:3002";
    }
    // In production/preview, re-throw the error
    throw error;
  }
};

export function createTRPCLinks() {
  return [
    httpBatchLink({
      url: `${getBaseUrl()}/api/trpc`,
      transformer: superjson,
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
