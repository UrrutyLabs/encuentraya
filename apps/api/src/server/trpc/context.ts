import type { Actor } from "../auth/roles";
import { Role } from "@repo/domain";
import { userRepository } from "../repositories/user.repo";
import { SupabaseAuthProvider } from "../auth/providers/supabase.provider";
import type { AuthProvider } from "../auth/provider";

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
 * Create tRPC context from request
 * Verifies Supabase access token and resolves user from database
 */
export async function createContext(req: Request): Promise<{ actor: Actor | null }> {
  const token = extractBearerToken(req);

  // If no token, return unauthenticated
  if (!token) {
    return { actor: null };
  }

  // Verify token with auth provider
  const authResult = await authProvider.verifyAccessToken(token);
  if (!authResult) {
    return { actor: null };
  }

  const supabaseUserId = authResult.userId;

  // Lookup user in our database
  let user = await userRepository.findById(supabaseUserId);

  // If user doesn't exist, create it with default CLIENT role
  if (!user) {
    user = await userRepository.create(Role.CLIENT, supabaseUserId);
  }

  return {
    actor: {
      id: user.id,
      role: user.role,
    },
  };
}
