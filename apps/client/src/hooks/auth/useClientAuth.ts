import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./useAuth";
import { useUserRole } from "./useUserRole";
import { Role } from "@repo/domain";

/**
 * Hook to check if user is authenticated
 * Redirects based on role:
 * - CLIENT -> /
 * - PRO -> /pro
 * Returns loading state
 */
export function useClientAuth() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { role, isLoading: isLoadingRole } = useUserRole();

  useEffect(() => {
    if (authLoading || (user && isLoadingRole)) {
      // Still loading auth or role
      return;
    }

    if (user) {
      // User is authenticated, redirect based on role
      if (role === Role.PRO) {
        router.replace("/pro/download-app");
      } else {
        // CLIENT or no role yet -> redirect to my-jobs
        router.replace("/my-jobs");
      }
    }
  }, [user, authLoading, role, isLoadingRole, router]);

  return {
    isLoading: authLoading || (user && isLoadingRole),
  };
}
