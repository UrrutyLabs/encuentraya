import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";

/**
 * Hook to reset password
 * Resets password using the token from the reset link
 */
export function useResetPassword() {
  const router = useRouter();

  const resetPasswordMutation = trpc.auth.resetPassword.useMutation({
    onSuccess: () => {
      // Redirect to login with success message
      router.push("/my-bookings");
    },
  });

  const resetPassword = async (token: string, newPassword: string) => {
    try {
      await resetPasswordMutation.mutateAsync({ token, newPassword });
      // Success - mutation's onSuccess will handle redirect
    } catch (error) {
      // Error is handled by mutation state
      throw error;
    }
  };

  return {
    resetPassword,
    isPending: resetPasswordMutation.isPending,
    error: resetPasswordMutation.error,
  };
}
