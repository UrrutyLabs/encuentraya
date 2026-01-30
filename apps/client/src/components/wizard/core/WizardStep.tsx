"use client";

import { ReactNode } from "react";
import { Card, Text } from "@repo/ui";
import { useWizardContext } from "./WizardContext";
import { WizardOptionRenderer } from "./WizardOptionRenderer";

interface WizardStepProps {
  /**
   * Custom render function for the step
   * If provided, receives step data and children (options)
   */
  render?: (props: {
    title: string;
    description?: string;
    children: ReactNode;
    stepIndex: number;
    totalSteps: number;
  }) => ReactNode;
  /**
   * Custom className for the step container
   */
  className?: string;
}

/**
 * WizardStep Component
 *
 * Renders the current step with all its options
 * Uses WizardOptionRenderer for each option
 */
export function WizardStep({ render, className = "" }: WizardStepProps) {
  const {
    currentStep,
    currentStepIndex,
    totalSteps,
    updateAnswer,
    getAnswer,
    errors,
  } = useWizardContext();

  if (!currentStep) {
    return null;
  }

  const optionsContent = (
    <div className="space-y-3">
      {currentStep.options.map((option) => (
        <WizardOptionRenderer
          key={option.id}
          option={option}
          value={getAnswer(option.id)}
          onChange={(value) => updateAnswer(option.id, value)}
          error={errors[option.id]}
        />
      ))}
    </div>
  );

  if (render) {
    return (
      <div className={className}>
        {render({
          title: currentStep.title,
          description: currentStep.description,
          children: optionsContent,
          stepIndex: currentStepIndex,
          totalSteps,
        })}
      </div>
    );
  }

  return (
    <div className={className}>
      <Card className="p-4 md:p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-2">
            <Text variant="h1" className="text-primary text-center">
              {currentStep.title}
            </Text>
          </div>
          {currentStep.description && (
            <Text variant="body" className="text-muted text-center">
              {currentStep.description}
            </Text>
          )}
          {optionsContent}
        </div>
      </Card>
    </div>
  );
}
