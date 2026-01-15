import { useState } from "react";
import { useRouter } from "expo-router";
import { trpc } from "@lib/trpc/client";
import { useQueryClient } from "../shared/useQueryClient";
import { invalidateRelatedQueries } from "@lib/react-query/utils";
import type { ProOnboardInput } from "@repo/domain";

export function useOnboarding() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const convertToProMutation = trpc.pro.convertToPro.useMutation({
    ...invalidateRelatedQueries(queryClient, [
      [["pro", "getMyProfile"]],
      [["auth", "me"]], // Role may change after onboarding
    ]),
    onSuccess: () => {
      setError(null);
      router.replace("/(tabs)/home");
    },
    onError: (err) => {
      setError(err.message || "Error al crear perfil de profesional");
    },
  });

  const submitOnboarding = async (input: ProOnboardInput) => {
    setError(null);
    try {
      await convertToProMutation.mutateAsync(input);
    } catch (err) {
      // Error is handled by onError callback
      throw err;
    }
  };

  return {
    submitOnboarding,
    isLoading: convertToProMutation.isPending,
    error,
  };
}
