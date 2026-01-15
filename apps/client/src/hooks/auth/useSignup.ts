import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import type { ClientSignupInput } from "@repo/domain";

/**
 * Hook to handle user signup
 * Encapsulates the auth.signup mutation and handles navigation to confirmation screen
 */
export function useSignup(returnUrl?: string | null) {
  const router = useRouter();

  const signupMutation = trpc.auth.signup.useMutation({
    onSuccess: (data) => {
      // Redirect to email confirmation screen, preserving returnUrl if provided
      const params = new URLSearchParams();
      params.set("email", data.email);
      if (returnUrl) {
        params.set("returnUrl", returnUrl);
      }
      router.push(`/confirm-email?${params.toString()}`);
    },
  });

  const handleSignup = async (input: ClientSignupInput) => {
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
