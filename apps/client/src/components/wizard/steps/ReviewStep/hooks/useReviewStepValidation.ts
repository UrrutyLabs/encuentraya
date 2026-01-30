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
 */
export function useReviewStepValidation({
  state,
  category,
  pro,
}: UseReviewStepValidationProps): UseReviewStepValidationReturn {
  const hasCompleteState = useMemo(
    () =>
      !!(
        state.proId &&
        category &&
        state.date &&
        state.time &&
        state.address &&
        state.hours
      ),
    [state.proId, category, state.date, state.time, state.address, state.hours]
  );

  const isLoadingPro = useMemo(() => !!state.proId && !pro, [state.proId, pro]);

  return { hasCompleteState, isLoadingPro };
}
