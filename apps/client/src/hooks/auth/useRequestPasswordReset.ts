import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { translateAuthError } from "@/lib/supabase/auth-utils";
import type { AuthError } from "@supabase/supabase-js";

/**
 * Hook to request password reset
 * Sends password reset email to the provided email address using Supabase
 */
export function useRequestPasswordReset() {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<AuthError | null>(null);

  const requestPasswordReset = async (email: string) => {
    setIsPending(true);
    setError(null);

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email,
        {
          redirectTo: `${window.location.origin}/reset-password`,
        }
      );

      if (resetError) {
        setError(resetError);
        throw resetError;
      }
    } catch (err) {
      const authError = err as AuthError;
      setError(authError);
      throw authError;
    } finally {
      setIsPending(false);
    }
  };

  return {
    requestPasswordReset,
    isPending,
    error: error ? { message: translateAuthError(error) } : null,
  };
}
