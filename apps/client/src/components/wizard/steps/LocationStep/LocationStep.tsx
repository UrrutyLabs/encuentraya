"use client";

import { useCallback } from "react";
import { useWizardState } from "@/lib/wizard/useWizardState";
import { useCategoryBySlug } from "@/hooks/category";
import { LocationStepHeader } from "./LocationStepHeader";
import { LocationStepErrors } from "./LocationStepErrors";
import { LocationStepContent } from "./LocationStepContent";
import { LocationStepNavigation } from "./LocationStepNavigation";
import { useLocationStepData, useLocationStepValidation } from "./hooks";

interface LocationStepProps {
  onNext?: () => void;
  onBack?: () => void;
}

export function LocationStep({}: LocationStepProps) {
  const { state, navigateToStep } = useWizardState();
  const { category } = useCategoryBySlug(state.categorySlug ?? undefined);
  const { address, hours, setAddress, setHours, estimatedCost } =
    useLocationStepData();

  const { canProceed, hasCompleteState } = useLocationStepValidation({
    address,
    hours,
    category,
  });

  const handleNext = useCallback(() => {
    if (!canProceed) return;
    const isFixed = category?.pricingMode === "fixed";
    navigateToStep("photos", {
      address,
      hours: isFixed ? "0" : hours,
    });
  }, [canProceed, navigateToStep, address, hours, category?.pricingMode]);

  const handleBack = useCallback(() => {
    navigateToStep("service-details");
  }, [navigateToStep]);

  if (!hasCompleteState) {
    return <LocationStepErrors hasCompleteState={hasCompleteState} />;
  }

  return (
    <div>
      <LocationStepHeader />
      <LocationStepContent
        address={address}
        hours={hours}
        onAddressChange={setAddress}
        onHoursChange={setHours}
        estimatedCost={estimatedCost}
        isFixedPrice={category?.pricingMode === "fixed"}
      />
      <LocationStepNavigation
        onBack={handleBack}
        onNext={handleNext}
        canProceed={canProceed}
      />
    </div>
  );
}
