"use client";

import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/auth";
import { useUserRole } from "@/hooks/auth";
import { Role } from "@repo/domain";
import { AuthLoadingState } from "@/components/auth/AuthLoadingState";

interface ProConfirmEmailGuardProps {
  children: ReactNode;
}

/**
 * Guard for pro confirm-email page
 * - Allows unauthenticated users (they just signed up)
 * - Allows authenticated PRO users
 * - Redirects authenticated CLIENT users to /
 */
export function ProConfirmEmailGuard({ children }: ProConfirmEmailGuardProps) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { role, isLoading: isLoadingRole } = useUserRole();

  useEffect(() => {
    // Still loading, wait
    if (authLoading || (user && isLoadingRole)) {
      return;
    }

    // If user is authenticated and has CLIENT role, redirect them
    if (user && role === Role.CLIENT) {
      router.replace("/");
      return;
    }

    // Allow access if:
    // - Not authenticated (user just signed up)
    // - Authenticated with PRO role
  }, [user, role, authLoading, isLoadingRole, router]);

  // Show loading while checking
  if (authLoading || (user && isLoadingRole)) {
    return <AuthLoadingState />;
  }

  // If user is CLIENT, don't render (redirect will happen)
  if (user && role === Role.CLIENT) {
    return null;
  }

  // Allow access for unauthenticated or PRO users
  return <>{children}</>;
}
