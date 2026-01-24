import { httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import { supabase } from "../supabase/client";

/**
 * Get the base URL for the API.
 * 
 * For device testing (physical device or emulator):
 * - localhost/127.0.0.1 will NOT work
 * - Use your machine's LAN IP address instead (e.g., http://192.168.1.100:3002)
 * - Find your IP: macOS/Linux: `ifconfig | grep inet`, Windows: `ipconfig`
 * 
 * For Expo Go on same machine: localhost may work, but LAN IP is more reliable.
 */
const getBaseUrl = () => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    const url = process.env.EXPO_PUBLIC_API_URL;
    // Log the URL being used (helpful for debugging)
    if (__DEV__) {
      console.log(`[tRPC] Using API URL: ${url}`);
    }
    return url;
  }
  // Fallback to localhost (may not work on physical devices)
  const fallbackUrl = "http://localhost:3002";
  if (__DEV__) {
    console.warn(
      `[tRPC] EXPO_PUBLIC_API_URL not set, using fallback: ${fallbackUrl}\n` +
      `⚠️  This may not work on physical devices. Set EXPO_PUBLIC_API_URL to your computer's LAN IP (e.g., http://192.168.1.100:3002)`
    );
  }
  return fallbackUrl;
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
