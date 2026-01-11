import type { Actor } from "../auth/roles";
import { Role } from "@repo/domain";
import { userRepository } from "../repositories/user.repo";
import { SupabaseAuthProvider } from "../auth/providers/supabase.provider";
import type { AuthProvider } from "../auth/provider";
import { randomUUID } from "crypto";

// Initialize auth provider (can be swapped for other providers)
const authProvider: AuthProvider = new SupabaseAuthProvider();

/**
 * Extract Bearer token from Authorization header
 */
function extractBearerToken(req: Request): string | null {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.substring(7); // Remove "Bearer " prefix
}

/**
 * Generate or extract request ID from headers
 */
function getRequestId(req: Request): string {
  // Check if request ID is provided in headers (useful for tracing)
  const existingId = req.headers.get("x-request-id");
  if (existingId) {
    return existingId;
  }
  // Generate a new request ID
  return randomUUID();
}

/**
 * Create tRPC context from request
 * Verifies Supabase access token and resolves user from database
 * Includes request ID for tracing
 */
export async function createContext(req: Request): Promise<{
  actor: Actor | null;
  requestId: string;
}> {
  const requestId = getRequestId(req);
  const token = extractBearerToken(req);

  // If no token, return unauthenticated
  if (!token) {
    return { actor: null, requestId };
  }

  // Verify token with auth provider
  const authResult = await authProvider.verifyAccessToken(token);
  if (!authResult) {
    return { actor: null, requestId };
  }

  const supabaseUserId = authResult.userId;
  const userMetadata = authResult.userMetadata;

  // Lookup user in our database
  let user = await userRepository.findById(supabaseUserId);

  // If user doesn't exist, create it with role from metadata or default CLIENT
  if (!user) {
    // Check for intended role in user metadata (set during signup)
    // This allows pro_mobile app to create users with PRO role directly
    const intendedRole = userMetadata?.intendedRole;
    const role =
      intendedRole === "pro" ? Role.PRO : Role.CLIENT;

    user = await userRepository.create(role, supabaseUserId);
  }

  return {
    actor: {
      id: user.id,
      role: user.role,
    },
    requestId,
  };
}
