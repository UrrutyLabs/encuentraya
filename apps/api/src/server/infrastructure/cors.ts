/**
 * CORS configuration helper
 * Reads allowed origins from environment variables
 */

/**
 * Get the allowed CORS origin based on environment configuration
 * 
 * If CORS_ALLOWED_ORIGINS is set, it should be a comma-separated list of origins.
 * If not set, defaults to "*" (allow all origins) for development convenience.
 * 
 * For production, set CORS_ALLOWED_ORIGINS to specific origins:
 * CORS_ALLOWED_ORIGINS=https://example.com,https://www.example.com
 */
export function getAllowedOrigin(): string {
  const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS;

  // If not set, default to "*" (allow all) for development
  if (!allowedOrigins) {
    return "*";
  }

  // Return the configured origins (comma-separated)
  return allowedOrigins;
}

/**
 * Get CORS headers for a request
 * Optionally validates the request origin against allowed origins
 */
export function getCorsHeaders(requestOrigin?: string | null): Record<string, string> {
  const allowedOrigin = getAllowedOrigin();

  // If allowedOrigin is "*", use it directly
  if (allowedOrigin === "*") {
    return {
      "Access-Control-Allow-Origin": "*",
    };
  }

  // Parse allowed origins from comma-separated string
  const allowedOriginsList = allowedOrigin.split(",").map((origin) => origin.trim());

  // If request origin is provided and matches an allowed origin, use it
  // Otherwise, use the first allowed origin (or "*" if none)
  const originToUse =
    requestOrigin && allowedOriginsList.includes(requestOrigin)
      ? requestOrigin
      : allowedOriginsList[0] || "*";

  return {
    "Access-Control-Allow-Origin": originToUse,
  };
}

/**
 * Get full CORS headers for tRPC endpoints
 */
export function getTrpcCorsHeaders(requestOrigin?: string | null): Record<string, string> {
  return {
    ...getCorsHeaders(requestOrigin),
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers":
      "Content-Type, Authorization, x-user-id, x-user-role, x-request-id",
  };
}

/**
 * Get CORS headers for webhook endpoints
 */
export function getWebhookCorsHeaders(requestOrigin?: string | null): Record<string, string> {
  return {
    ...getCorsHeaders(requestOrigin),
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}
