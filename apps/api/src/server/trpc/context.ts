import type { Actor } from "../auth/roles";
import { Role } from "@repo/domain";

/**
 * Create tRPC context from request headers
 * Extracts user ID and role from headers:
 * - x-user-id: User identifier
 * - x-user-role: User role (client|pro|admin)
 */
export function createContext(req: Request): { actor: Actor | null } {
  const userId = req.headers.get("x-user-id");
  const userRole = req.headers.get("x-user-role");

  // If either header is missing, actor is null (unauthenticated)
  if (!userId || !userRole) {
    return { actor: null };
  }

  // Validate role
  const validRoles: Role[] = [Role.CLIENT, Role.PRO, Role.ADMIN];
  if (!validRoles.includes(userRole as Role)) {
    return { actor: null };
  }

  return {
    actor: {
      id: userId,
      role: userRole as Role,
    },
  };
}
