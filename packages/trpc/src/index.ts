import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import type { AnyRouter } from "@trpc/server";

/**
 * Creates a tRPC client with superjson transformer configured.
 * This is a universal helper that works in both web and mobile environments.
 *
 * @param url - The API URL (e.g., "http://localhost:3002/api/trpc")
 * @returns Configured tRPC proxy client
 */
export function createTRPCClientWithSuperjson<TRouter extends AnyRouter>(
  url: string
) {
  return createTRPCProxyClient<TRouter>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- superjson transformer type compatibility
    transformer: superjson as any,
    links: [
      httpBatchLink({
        url,
        // Use fetch which is available in both browser and React Native
        fetch: (input, init) => {
          return fetch(input, {
            ...init,
            headers: {
              "Content-Type": "application/json",
              ...init?.headers,
            },
          });
        },
      }),
    ],
  });
}

/**
 * Re-export superjson for convenience
 */
export { superjson };

/**
 * Type helper for extracting the router type from a tRPC client
 */
export type ExtractRouterType<T> = T extends { $inferRouter: infer R }
  ? R
  : never;

/**
 * Export AppRouter type for use in client apps
 * This allows both client and mobile apps to import the type
 * without needing to resolve the API's internal path aliases
 */
export type { AppRouter } from "./router";
