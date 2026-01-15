import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./useAuth";

/**
 * Hook to check if user is authenticated
 * Redirects to /search if authenticated (any role)
 * Returns loading state
 */
export function useClientAuth() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && user) {
      // User is authenticated, redirect away from landing page
      router.replace("/search");
    }
  }, [user, authLoading, router]);

  return {
    isLoading: authLoading,
  };
}
