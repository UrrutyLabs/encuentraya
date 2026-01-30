import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { useClientProfile } from "./useClientProfile";
import type { PreferredContactMethod } from "@repo/domain";
import { logger } from "@/lib/logger";
import { useQueryClient } from "../shared";
import { invalidateRelatedQueries } from "@/lib/react-query/utils";

/**
 * Hook to handle settings form logic
 * Encapsulates profile data fetching, form state management, and update mutation
 */
export function useSettingsForm() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Fetch current profile
  const {
    profile,
    isLoading: isLoadingProfile,
    error: profileError,
  } = useClientProfile();

  // Derive initial form values from profile
  const initialValues = useMemo(
    () => ({
      phone: profile?.phone || "",
      preferredContactMethod: (profile?.preferredContactMethod || "") as
        | PreferredContactMethod
        | "",
    }),
    [profile]
  );

  // Form state
  const [phone, setPhone] = useState(initialValues.phone);
  const [preferredContactMethod, setPreferredContactMethod] = useState<
    PreferredContactMethod | ""
  >(initialValues.preferredContactMethod);

  // Update form state when profile loads or changes
  useEffect(() => {
    setPhone(initialValues.phone);
    setPreferredContactMethod(initialValues.preferredContactMethod);
  }, [initialValues]);

  // Update mutation
  const updateMutation = trpc.clientProfile.update.useMutation({
    ...invalidateRelatedQueries(queryClient, [[["clientProfile", "get"]]]),
    onSuccess: () => {
      // Redirect immediately - profile will refetch when user navigates back
      router.push("/my-jobs");
    },
    onError: (error) => {
      logger.error(
        "Error updating profile",
        error instanceof Error ? error : new Error(String(error))
      );
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({
      phone: phone || null,
      preferredContactMethod:
        (preferredContactMethod as PreferredContactMethod) || null,
    });
  };

  return {
    // Profile data
    profile,
    isLoading: isLoadingProfile,
    profileError,

    // Form state
    phone,
    preferredContactMethod,
    setPhone,
    setPreferredContactMethod,

    // Form actions
    handleSubmit,

    // Mutation state
    isPending: updateMutation.isPending,
    error: updateMutation.error,
  };
}
