"use client";

import { useMemo } from "react";
import type { WizardState } from "@/lib/wizard/useWizardState";
import type { Category } from "@repo/domain";
import type { Pro } from "@repo/domain";

interface UseReviewStepValidationProps {
  state: WizardState;
  category: Category | null | undefined;
  pro: Pro | null | undefined;
}

interface UseReviewStepValidationReturn {
  hasCompleteState: boolean;
  isLoadingPro: boolean;
}

/**
 * Encapsulates "can we show the main review content?" (incomplete vs loading vs ready).
 * For fixed-price categories, hours are not required (pro will send quote).
 */
export function useReviewStepValidation({
  state,
  category,
  pro,
}: UseReviewStepValidationProps): UseReviewStepValidationReturn {
  const isFixedPrice = category?.pricingMode === "fixed";
  const hasCompleteState = useMemo(
    () =>
      !!(
        state.proId &&
        category &&
        state.date &&
        state.time &&
        state.address &&
        (isFixedPrice || (state.hours && parseFloat(state.hours) > 0))
      ),
    [
      state.proId,
      category,
      state.date,
      state.time,
      state.address,
      state.hours,
      isFixedPrice,
    ]
  );

  const isLoadingPro = useMemo(() => !!state.proId && !pro, [state.proId, pro]);

  return { hasCompleteState, isLoadingPro };
}
