import { Role } from "@repo/domain";

/**
 * Actor represents the authenticated user making the request
 */
export interface Actor {
  id: string;
  role: Role;
}

/**
 * Type guard to check if an actor is authenticated
 */
export function isAuthenticated(actor: Actor | null): actor is Actor {
  return actor !== null;
}

/**
 * Type guard to check if actor has a specific role
 */
export function hasRole(actor: Actor | null, role: Role): actor is Actor {
  return isAuthenticated(actor) && actor.role === role;
}
