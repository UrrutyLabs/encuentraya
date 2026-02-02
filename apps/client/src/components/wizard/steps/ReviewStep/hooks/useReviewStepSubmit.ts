"use client";

import { useCallback } from "react";
import { useCreateOrder } from "@/hooks/order";
import { useWizardState } from "@/lib/wizard/useWizardState";
import { usePhotoUrls } from "@/contexts/PhotoUrlsContext";
import type { CategoryMetadataInput } from "@repo/domain";
import type { Category } from "@repo/domain";
import { logger } from "@/lib/logger";

interface UseReviewStepSubmitProps {
  category: Category | null | undefined;
  categoryMetadataJson: CategoryMetadataInput | undefined;
}

interface UseReviewStepSubmitReturn {
  handleSubmit: () => Promise<void>;
  isPending: boolean;
  /** TRPC mutation error – use (error as Error).message for display */
  error: unknown;
}

/**
 * Encapsulates submit flow for Review step: guard, build payload, call createOrder, log errors.
 */
export function useReviewStepSubmit({
  category,
  categoryMetadataJson,
}: UseReviewStepSubmitProps): UseReviewStepSubmitReturn {
  const { state } = useWizardState();
  const { photoUrls } = usePhotoUrls();
  const { createOrder, isPending, error } = useCreateOrder();

  const handleSubmit = useCallback(async () => {
    const isFixedPrice = category?.pricingMode === "fixed";
    const hasHours = state.hours && parseFloat(state.hours) > 0;
    if (
      !state.proId ||
      !category?.id ||
      !state.date ||
      !state.time ||
      !state.address ||
      (!isFixedPrice && !hasHours)
    ) {
      return;
    }
    const scheduledAt = new Date(`${state.date}T${state.time}`);
    const estimatedHours = isFixedPrice ? 0 : parseFloat(state.hours!);
    try {
      await createOrder({
        proProfileId: state.proId,
        categoryId: category.id,
        description: `Servicio en ${state.address}`,
        addressText: state.address,
        scheduledWindowStartAt: scheduledAt,
        estimatedHours,
        categoryMetadataJson: categoryMetadataJson,
        photoUrls: photoUrls.length > 0 ? photoUrls : undefined,
      });
    } catch (err) {
      logger.error(
        "Error creating order",
        err instanceof Error ? err : new Error(String(err)),
        { proProfileId: state.proId, categoryId: category.id }
      );
    }
  }, [
    state.proId,
    state.date,
    state.time,
    state.address,
    state.hours,
    category,
    categoryMetadataJson,
    photoUrls,
    createOrder,
  ]);

  return {
    handleSubmit,
    isPending,
    error: error ?? null,
  };
}
