"use client";

import { useWizardContext } from "./WizardContext";

interface WizardProgressProps {
  /**
   * Variant: "dots" | "fraction" | "bar"
   */
  variant?: "dots" | "fraction" | "bar";
  /**
   * Custom className
   */
  className?: string;
}

/**
 * WizardProgress Component
 *
 * Shows progress indicator for the wizard
 */
export function WizardProgress({
  variant = "fraction",
  className = "",
}: WizardProgressProps) {
  const { currentStepIndex, totalSteps } = useWizardContext();

  if (totalSteps <= 1) {
    return null;
  }

  const progress = ((currentStepIndex + 1) / totalSteps) * 100;

  if (variant === "fraction") {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <span className="text-sm text-muted">
          {currentStepIndex + 1} / {totalSteps}
        </span>
      </div>
    );
  }

  if (variant === "bar") {
    return (
      <div className={`w-full ${className}`}>
        <div className="h-2 bg-surface border border-border rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
            role="progressbar"
            aria-valuenow={currentStepIndex + 1}
            aria-valuemin={1}
            aria-valuemax={totalSteps}
          />
        </div>
      </div>
    );
  }

  // dots variant
  return (
    <div
      className={`flex items-center justify-center gap-2 ${className}`}
      role="progressbar"
      aria-valuenow={currentStepIndex + 1}
      aria-valuemin={1}
      aria-valuemax={totalSteps}
    >
      {Array.from({ length: totalSteps }).map((_, index) => (
        <div
          key={index}
          className={`w-2 h-2 rounded-full transition-colors ${
            index <= currentStepIndex
              ? "bg-primary"
              : "bg-surface border border-border"
          }`}
          aria-label={`Paso ${index + 1}`}
        />
      ))}
    </div>
  );
}
