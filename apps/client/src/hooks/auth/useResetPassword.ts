import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { translateAuthError } from "@/lib/supabase/auth-utils";
import { useUserRole } from "./useUserRole";
import { Role } from "@repo/domain";

/**
 * Hook to reset password
 * Uses Supabase's recovery session flow - when user clicks reset link,
 * Supabase automatically creates a recovery session. We use updateUser()
 * to set the new password, which converts the recovery session to a regular session.
 */
export function useResetPassword() {
  const router = useRouter();
  const { role, isLoading: isLoadingRole } = useUserRole();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<{ message: string } | null>(null);
  const [hasRecoverySession, setHasRecoverySession] = useState<boolean | null>(
    null
  );

  // Check if we have a recovery session (user clicked reset link)
  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      // Recovery session exists if session exists after clicking reset link
      // Supabase automatically creates a recovery session when user clicks reset link
      setHasRecoverySession(!!session);
    };
    checkSession();

    // Also listen for auth state changes (in case session is created asynchronously)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setHasRecoverySession(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const resetPassword = async (newPassword: string) => {
    setIsPending(true);
    setError(null);

    try {
      // Check if we have a session (recovery session from reset link)
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        const errorMessage =
          "No se encontró una sesión de recuperación. Por favor, solicitá un nuevo enlace.";
        setError({ message: errorMessage });
        throw new Error(errorMessage);
      }

      // Update password using recovery session
      // This converts the recovery session to a regular session
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        const translatedError = translateAuthError(updateError);
        setError({ message: translatedError });
        throw updateError;
      }

      // Password updated successfully - user is now signed in
      // Wait a moment for auth state to update, then redirect based on role
      setTimeout(() => {
        if (role === Role.PRO) {
          router.push("/pro/download-app");
        } else {
          router.push("/my-bookings");
        }
      }, 500);
    } catch (err) {
      // Error already set above, just rethrow
      throw err;
    } finally {
      setIsPending(false);
    }
  };

  return {
    resetPassword,
    isPending,
    error,
    hasRecoverySession,
    isLoading: isLoadingRole,
  };
}
