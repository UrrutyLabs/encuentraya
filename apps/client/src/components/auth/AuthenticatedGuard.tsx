"use client";

import { ReactNode } from "react";
import { useRequireAuth } from "@/hooks/auth";
import { AuthLoadingState } from "./AuthLoadingState";

interface AuthenticatedGuardProps {
  children: ReactNode;
  returnUrl?: string;
  maxWidth?: string;
}

/**
 * Container component that guards authenticated routes
 * Handles authentication check and redirect logic
 * Renders children only when user is authenticated
 */
export function AuthenticatedGuard({
  children,
  returnUrl,
  maxWidth,
}: AuthenticatedGuardProps) {
  const { isAuthenticated, isLoading } = useRequireAuth({
    redirectTo: "/login",
    returnUrl,
  });

  // Show loading state while checking authentication
  if (isLoading) {
    return <AuthLoadingState maxWidth={maxWidth} />;
  }

  // If not authenticated, useRequireAuth will handle redirect
  // Return null as safety check (redirect should happen in hook)
  if (!isAuthenticated) {
    return null;
  }

  // User is authenticated, render children
  return <>{children}</>;
}
