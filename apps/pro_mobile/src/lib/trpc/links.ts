import { httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import { supabase } from "../supabase/client";
import { getApiUrl, getEnvironment } from "../env";

/**
 * Get the base URL for the API.
 * 
 * Uses environment detection to automatically select the correct API URL:
 * - Development: localhost or local IP (from EXPO_PUBLIC_LOCAL_API_URL)
 * - Preview: Staging API URL
 * - Production: Production API URL
 * 
 * For device testing (physical device or emulator):
 * - localhost/127.0.0.1 will NOT work
 * - Use your machine's LAN IP address instead (e.g., http://192.168.1.100:3002)
 * - Set EXPO_PUBLIC_LOCAL_API_URL in .env for local development
 * - Find your IP: macOS/Linux: `ifconfig | grep inet`, Windows: `ipconfig`
 */
const getBaseUrl = () => {
  try {
    const url = getApiUrl();
    const env = getEnvironment();
    
    // Log the URL being used (helpful for debugging)
    if (__DEV__ || env === "development") {
      console.log(`[tRPC] Environment: ${env}, Using API URL: ${url}`);
    }
    
    return url;
  } catch (error) {
    // In development, allow fallback to localhost with warning
    if (__DEV__) {
      const fallbackUrl = process.env.EXPO_PUBLIC_LOCAL_API_URL || "http://localhost:3002";
      console.warn(
        `[tRPC] Environment detection failed, using fallback: ${fallbackUrl}\n` +
        `⚠️  This may not work on physical devices. Set EXPO_PUBLIC_LOCAL_API_URL to your computer's LAN IP (e.g., http://192.168.1.100:3002)`,
        error
      );
      return fallbackUrl;
    }
    // In production/preview builds, re-throw the error
    throw error;
  }
};

export function createTRPCLinks() {
  return [
    httpBatchLink({
      url: `${getBaseUrl()}/api/trpc`,
      transformer: superjson,
      headers: async () => {
        // Read Supabase session access_token at request time
        const {
          data: { session },
        } = await supabase.auth.getSession();
        
        const headers: Record<string, string> = {};
        
        // Attach Authorization Bearer token if session exists
        if (session?.access_token) {
          headers.Authorization = `Bearer ${session.access_token}`;
        }
        
        return headers;
      },
    }),
  ];
}
