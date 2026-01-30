"use client";

import { Button } from "@repo/ui";

interface LocationStepNavigationProps {
  onBack: () => void;
  onNext: () => void;
  canProceed: boolean;
}

/**
 * Presentational navigation: Atrás + Continuar buttons
 */
export function LocationStepNavigation({
  onBack,
  onNext,
  canProceed,
}: LocationStepNavigationProps) {
  return (
    <>
      <div className="flex flex-col-reverse md:flex-row justify-between gap-3 md:gap-0 mt-6 md:mt-6">
        <Button
          variant="ghost"
          onClick={onBack}
          className="min-h-[44px] px-6 py-3 md:py-2 w-full md:w-auto text-base md:text-sm"
        >
          Atrás
        </Button>
        <Button
          variant="primary"
          onClick={onNext}
          disabled={!canProceed}
          className="min-h-[44px] px-6 py-3 md:py-2 w-full md:w-auto text-base md:text-sm"
        >
          Continuar
        </Button>
      </div>
      {!canProceed && (
        <div
          id="location-validation-message"
          className="mt-2 text-sm text-warning text-center md:text-right"
          role="alert"
          aria-live="polite"
        >
          Por favor, completá todos los campos requeridos antes de continuar.
        </div>
      )}
    </>
  );
}
