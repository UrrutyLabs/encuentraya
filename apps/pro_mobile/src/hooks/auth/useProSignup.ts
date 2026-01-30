import { useRouter } from "expo-router";
import { trpc } from "@lib/trpc/client";
import type { ProSignupInput } from "@repo/domain";

/**
 * Hook to handle pro signup
 * Encapsulates the auth.proSignup mutation and handles navigation to confirmation screen
 */
export function useProSignup() {
  const router = useRouter();

  const signupMutation = trpc.auth.proSignup.useMutation({
    onSuccess: (data: { email: string }) => {
      // Redirect to email confirmation screen
      router.replace({
        pathname: "/auth/confirm-email",
        params: { email: data.email },
      });
    },
  });

  const handleSignup = async (input: ProSignupInput) => {
    try {
      await signupMutation.mutateAsync(input);
      // Success - mutation's onSuccess will handle redirect
    } catch (error) {
      // Error is handled by mutation state
      throw error;
    }
  };

  return {
    signup: handleSignup,
    isPending: signupMutation.isPending,
    error: signupMutation.error,
  };
}
