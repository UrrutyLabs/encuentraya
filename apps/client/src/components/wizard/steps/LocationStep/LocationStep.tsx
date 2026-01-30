"use client";

import { useCallback } from "react";
import { useWizardState } from "@/lib/wizard/useWizardState";
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
  const { navigateToStep } = useWizardState();
  const { address, hours, setAddress, setHours, estimatedCost } =
    useLocationStepData();

  const { canProceed, hasCompleteState } = useLocationStepValidation({
    address,
    hours,
  });

  const handleNext = useCallback(() => {
    if (!canProceed) return;
    navigateToStep("review", {
      address,
      hours,
    });
  }, [canProceed, navigateToStep, address, hours]);

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
      />
      <LocationStepNavigation
        onBack={handleBack}
        onNext={handleNext}
        canProceed={canProceed}
      />
    </div>
  );
}
