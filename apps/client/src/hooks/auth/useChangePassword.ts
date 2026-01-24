import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { logger } from "@/lib/logger";
import { useQueryClient } from "../shared";
import { clearSessionStorage } from "@/lib/supabase/auth-utils";
import { supabase } from "@/lib/supabase/client";

export function useChangePassword() {
  const queryClient = useQueryClient();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const changePasswordMutation = trpc.auth.changePassword.useMutation({
    onSuccess: async () => {
      // Backend revokes all sessions automatically via Supabase Admin API
      // But we need to clear client-side cache and storage immediately

      // 1. Clear React Query cache (especially auth.me and user-related queries)
      queryClient.resetQueries({
        queryKey: [["auth", "me"]],
      });
      // Clear all auth-related queries
      queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey;
          return (
            Array.isArray(key) &&
            key[0] &&
            Array.isArray(key[0]) &&
            key[0][0] === "auth"
          );
        },
      });

      // 2. Clear Supabase local storage
      await clearSessionStorage();

      // 3. Sign out locally to ensure session is cleared from Supabase client
      try {
        await supabase.auth.signOut({ scope: "local" });
      } catch (err) {
        // Ignore errors - session might already be invalid
        logger.info(
          "Sign out after password change (expected if session already revoked)",
          {
            error: err instanceof Error ? err.message : String(err),
          }
        );
      }

      // 4. Use window.location for full page reload to ensure all state is cleared
      // This guarantees a clean state after password change
      window.location.href = "/login?passwordChanged=true";
    },
    onError: (error) => {
      logger.error(
        "Error changing password",
        error instanceof Error ? error : new Error(String(error))
      );
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      changePasswordMutation.reset();
      // We'll handle this in the component
      return;
    }

    changePasswordMutation.mutate({
      currentPassword,
      newPassword,
    });
  };

  return {
    currentPassword,
    setCurrentPassword,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    handleSubmit,
    isPending: changePasswordMutation.isPending,
    error: changePasswordMutation.error,
    isSuccess: changePasswordMutation.isSuccess,
  };
}
