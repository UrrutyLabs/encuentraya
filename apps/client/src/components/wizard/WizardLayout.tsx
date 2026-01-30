"use client";

import { ReactNode } from "react";
import { Check } from "lucide-react";
import { Text } from "@repo/ui";

interface WizardStep {
  number: number;
  label: string;
  isComplete: boolean;
  isActive: boolean;
}

interface WizardLayoutProps {
  currentStep: number;
  stepLabels: string[];
  children: ReactNode;
}

export function WizardLayout({
  currentStep,
  stepLabels,
  children,
}: WizardLayoutProps) {
  const steps: WizardStep[] = stepLabels.map((label, index) => ({
    number: index + 1,
    label,
    isComplete: index + 1 < currentStep,
    isActive: index + 1 === currentStep,
  }));

  return (
    <div className="min-h-screen bg-bg">
      <div className="px-4 py-4 md:py-8">
        <div className="max-w-4xl mx-auto">
          {/* Step Indicator - Mobile (dots only) */}
          <div className="md:hidden mb-4 md:mb-6">
            <div className="flex items-center justify-center gap-2">
              {steps.map((step) => (
                <div
                  key={step.number}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    step.isComplete || step.isActive
                      ? "bg-primary"
                      : "bg-surface border border-border"
                  } ${step.isActive ? "w-3 h-3" : ""}`}
                  aria-label={`Paso ${step.number}: ${step.label}`}
                />
              ))}
            </div>
          </div>

          {/* Step Indicator - Desktop */}
          <div className="hidden md:flex items-center justify-center mb-8">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <div className="flex items-center shrink-0">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-base font-medium transition-colors shrink-0 ${
                      step.isComplete
                        ? "bg-primary text-white"
                        : step.isActive
                          ? "bg-primary text-white"
                          : "bg-surface border-2 border-border text-muted"
                    }`}
                  >
                    {step.isComplete ? (
                      <Check className="w-6 h-6" />
                    ) : (
                      step.number
                    )}
                  </div>
                  <div className="ml-3 shrink-0">
                    <Text
                      variant="small"
                      className={`${
                        step.isActive
                          ? "text-primary font-medium"
                          : "text-muted"
                      }`}
                    >
                      Paso {step.number}
                    </Text>
                    <Text
                      variant="body"
                      className={`font-medium ${
                        step.isActive ? "text-text" : "text-muted"
                      }`}
                    >
                      {step.label}
                    </Text>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className="flex-1 mx-6 min-w-[60px]">
                    <div
                      className={`h-0.5 ${
                        step.isComplete ? "bg-primary" : "bg-border"
                      }`}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Content */}
          <div>{children}</div>
        </div>
      </div>
    </div>
  );
}
