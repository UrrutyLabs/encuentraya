"use client";

import { useWizardContext } from "./WizardContext";

interface WizardNavigationProps {
  /**
   * Custom render function for navigation buttons
   */
  render?: (props: {
    canGoNext: boolean;
    canGoBack: boolean;
    onNext: () => void;
    onBack: () => void;
    isLastStep: boolean;
  }) => React.ReactNode;
  /**
   * Custom className for navigation container
   */
  className?: string;
  /**
   * Show back button
   */
  showBack?: boolean;
  /**
   * Custom next button text
   */
  nextText?: string;
  /**
   * Custom back button text
   */
  backText?: string;
}

/**
 * WizardNavigation Component
 *
 * Renders navigation buttons (Back/Continue)
 * Only shows back button after first step
 */
export function WizardNavigation({
  render,
  className = "",
  showBack = true,
  nextText = "Continuar",
  backText = "Atrás",
}: WizardNavigationProps) {
  const { canGoNext, canGoBack, goNext, goBack, currentStepIndex, totalSteps } =
    useWizardContext();

  const isLastStep = currentStepIndex === totalSteps - 1;

  if (render) {
    return (
      <div className={className}>
        {render({
          canGoNext,
          canGoBack,
          onNext: goNext,
          onBack: goBack,
          isLastStep,
        })}
      </div>
    );
  }

  // Default render
  return (
    <div
      className={`flex flex-col-reverse md:flex-row justify-between gap-3 md:gap-0 mt-6 md:mt-6 ${className}`}
    >
      {showBack && canGoBack && (
        <button
          onClick={goBack}
          aria-label={backText}
          className="min-h-[44px] px-6 py-3 md:py-2 border border-border rounded-lg font-medium text-base md:text-sm hover:bg-surface active:bg-surface/80 transition-colors touch-manipulation w-full md:w-auto"
        >
          {backText}
        </button>
      )}
      <button
        onClick={goNext}
        disabled={!canGoNext}
        aria-label={isLastStep ? "Finalizar" : nextText}
        aria-describedby={!canGoNext ? "wizard-validation-message" : undefined}
        className="min-h-[44px] px-6 py-3 md:py-2 bg-primary text-white rounded-lg font-medium text-base md:text-sm hover:opacity-90 active:opacity-75 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation w-full md:w-auto"
      >
        {isLastStep ? "Finalizar" : nextText}
      </button>
      {!canGoNext && (
        <div
          id="wizard-validation-message"
          className="mt-2 text-sm text-warning text-center md:text-right"
          role="alert"
          aria-live="polite"
        >
          Por favor, completá todos los campos requeridos antes de continuar.
        </div>
      )}
    </div>
  );
}
