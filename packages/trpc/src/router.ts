/**
 * Re-export AppRouter type from the API server
 * This allows both client and mobile apps to import the type
 * without needing to resolve the API's internal path aliases
 * 
 * Note: This is a type-only import, so it doesn't require runtime resolution
 */
export type { AppRouter } from "../../../apps/api/src/server/routers/_app";
