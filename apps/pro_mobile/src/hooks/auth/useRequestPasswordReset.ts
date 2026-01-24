import { trpc } from "@lib/trpc/client";

/**
 * Hook to request password reset
 * Sends password reset email with OTP code to the provided email address
 */
export function useRequestPasswordReset() {
  const requestPasswordResetMutation =
    trpc.auth.requestPasswordReset.useMutation();

  const requestPasswordReset = async (email: string) => {
    try {
      await requestPasswordResetMutation.mutateAsync({ email });
    } catch (error) {
      // Error is handled by mutation state
      throw error;
    }
  };

  return {
    requestPasswordReset,
    isPending: requestPasswordResetMutation.isPending,
    error: requestPasswordResetMutation.error,
  };
}
