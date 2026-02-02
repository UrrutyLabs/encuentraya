"use client";

import { useMemo } from "react";
import { useWizardState } from "@/lib/wizard/useWizardState";
import type { Category } from "@repo/domain";

interface UseLocationStepValidationProps {
  address: string;
  hours: string;
  category?: Category | null;
}

interface UseLocationStepValidationReturn {
  canProceed: boolean;
  hasCompleteState: boolean;
}

/**
 * Encapsulates validation logic for LocationStep.
 * For fixed-price categories, hours are not required (pro will send quote).
 */
export function useLocationStepValidation({
  address,
  hours,
  category,
}: UseLocationStepValidationProps): UseLocationStepValidationReturn {
  const { state } = useWizardState();
  const isFixedPrice = category?.pricingMode === "fixed";

  const canProceed = useMemo(() => {
    const hasAddress = !!address.trim();
    if (isFixedPrice) return hasAddress;
    return !!(hasAddress && hours && parseFloat(hours) > 0);
  }, [address, hours, isFixedPrice]);

  const hasCompleteState = useMemo(
    () => !!(state.proId && state.categorySlug && state.date && state.time),
    [state.proId, state.categorySlug, state.date, state.time]
  );

  return { canProceed, hasCompleteState };
}
