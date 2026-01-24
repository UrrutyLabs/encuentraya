import { useRouter } from "expo-router";
import { trpc } from "@lib/trpc/client";

/**
 * Hook to reset password using OTP code
 * Verifies the OTP code from email and sets new password
 * Uses API endpoint for OTP verification (consistent with web client)
 */
export function useResetPasswordWithOtp() {
  const router = useRouter();

  const resetPasswordMutation = trpc.auth.resetPasswordWithOtp.useMutation({
    onSuccess: () => {
      // Redirect to login on success
      router.replace("/auth/login" as any);
    },
  });

  const resetPassword = async (
    email: string,
    otp: string,
    newPassword: string
  ) => {
    try {
      await resetPasswordMutation.mutateAsync({ email, otp, newPassword });
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
