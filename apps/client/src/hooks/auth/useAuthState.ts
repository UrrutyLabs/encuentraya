/**
 * Composite hook that combines useAuth and useUserRole
 * Provides a unified auth state interface
 */

import { useAuth } from "./useAuth";
import { useUserRole } from "./useUserRole";
import type { Role } from "@repo/domain";

export interface UseAuthStateReturn {
  /**
   * Current user (from Supabase)
   */
  user: ReturnType<typeof useAuth>["user"];
  /**
   * Current user's role (from API)
   */
  role: Role | null | undefined;
  /**
   * Whether auth state is loading
   */
  isLoading: boolean;
  /**
   * Error from role fetch (if any)
   */
  roleError: unknown;
  /**
   * Whether user is authenticated
   */
  isAuthenticated: boolean;
}

/**
 * Hook that combines useAuth and useUserRole into a single state
 * Automatically fetches role when user is authenticated
 *
 * @returns Combined auth state
 */
export function useAuthState(): UseAuthStateReturn {
  const { user, loading: authLoading } = useAuth();
  const { role, isLoading: roleLoading, error: roleError } = useUserRole();

  const isLoading = authLoading || (user && roleLoading) || false;
  const isAuthenticated = !!user;

  return {
    user,
    role,
    isLoading,
    roleError,
    isAuthenticated,
  };
}
