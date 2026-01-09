import type { Actor } from "./roles";
import { Role } from "@repo/domain";

/**
 * Guard helpers for role-based access control
 * These can be used in services or other layers if needed
 */

/**
 * Assert that an actor is authenticated
 * Throws if actor is null
 */
export function assertAuthenticated(
  actor: Actor | null
): asserts actor is Actor {
  if (!actor) {
    throw new Error("Authentication required");
  }
}

/**
 * Assert that an actor has a specific role
 * Throws if actor is null or doesn't have the required role
 */
export function assertRole(
  actor: Actor | null,
  requiredRole: Role
): asserts actor is Actor {
  assertAuthenticated(actor);
  if (actor.role !== requiredRole) {
    throw new Error(`Role '${requiredRole}' required`);
  }
}

/**
 * Check if actor can access a resource owned by a specific user ID
 * Returns true if actor is the owner or is an admin
 */
export function canAccessResource(
  actor: Actor | null,
  resourceOwnerId: string
): boolean {
  if (!actor) return false;
  return actor.id === resourceOwnerId || actor.role === Role.ADMIN;
}
