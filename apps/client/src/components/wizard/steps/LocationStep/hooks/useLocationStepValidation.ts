"use client";

import { useMemo } from "react";
import { useWizardState } from "@/lib/wizard/useWizardState";

interface UseLocationStepValidationProps {
  address: string;
  hours: string;
}

interface UseLocationStepValidationReturn {
  canProceed: boolean;
  hasCompleteState: boolean;
}

/**
 * Encapsulates validation logic for LocationStep
 */
export function useLocationStepValidation({
  address,
  hours,
}: UseLocationStepValidationProps): UseLocationStepValidationReturn {
  const { state } = useWizardState();

  const canProceed = useMemo(() => {
    return !!(address.trim() && hours && parseFloat(hours) > 0);
  }, [address, hours]);

  const hasCompleteState = useMemo(
    () => !!(state.proId && state.categorySlug && state.date && state.time),
    [state.proId, state.categorySlug, state.date, state.time]
  );

  return { canProceed, hasCompleteState };
}
