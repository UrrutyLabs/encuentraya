"use client";

import { WizardStep } from "../../core/WizardStep";
import { WizardNavigation } from "../../core/WizardNavigation";
import { WizardProgress } from "../../core/WizardProgress";
import { useWizardAnswerSync } from "./hooks/useWizardAnswerSync";

interface ServiceDetailsWizardContentProps {
  date: string;
  time: string;
  setDate: (date: string) => void;
  setTime: (time: string) => void;
  handleDateChangeWithValidation: (date: string) => void;
}

/**
 * Component to sync wizard answers with local state and render steps
 */
export function ServiceDetailsWizardContent({
  date,
  time,
  setDate,
  setTime,
  handleDateChangeWithValidation,
}: ServiceDetailsWizardContentProps) {
  // Sync wizard answers with local state
  useWizardAnswerSync({
    date,
    time,
    setDate,
    setTime,
    handleDateChangeWithValidation,
  });

  return (
    <>
      <WizardProgress variant="fraction" className="mb-4" />
      <WizardStep
        render={({ children }) => (
          <div className="animate-in fade-in duration-200">{children}</div>
        )}
      />
      <WizardNavigation />
    </>
  );
}
