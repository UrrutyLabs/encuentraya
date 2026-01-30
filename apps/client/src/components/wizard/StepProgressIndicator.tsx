"use client";

import { Text } from "@repo/ui";

interface StepProgressIndicatorProps {
  current: number;
  total: number;
  variant?: "dots" | "fraction";
  className?: string;
}

/**
 * StepProgressIndicator Component
 *
 * Reusable progress indicator for multi-step flows
 * Shows current step progress (e.g., "1/2" or dots)
 */
export function StepProgressIndicator({
  current,
  total,
  variant = "fraction",
  className = "",
}: StepProgressIndicatorProps) {
  if (total <= 1) {
    return null; // Don't show if only one step
  }

  return (
    <div
      className={`flex items-center gap-2 ${className}`}
      role="progressbar"
      aria-valuenow={current}
      aria-valuemin={1}
      aria-valuemax={total}
      aria-label={`Paso ${current} de ${total}`}
    >
      {variant === "dots" ? (
        <div className="flex items-center gap-2">
          {Array.from({ length: total }, (_, index) => {
            const stepNumber = index + 1;
            const isActive = stepNumber === current;
            const isComplete = stepNumber < current;

            return (
              <div
                key={stepNumber}
                className={`w-2 h-2 rounded-full transition-all ${
                  isActive
                    ? "bg-primary w-3 h-3"
                    : isComplete
                      ? "bg-primary/50"
                      : "bg-border"
                }`}
                aria-hidden="true"
              />
            );
          })}
        </div>
      ) : (
        <Text variant="small" className="text-muted">
          {current}/{total}
        </Text>
      )}
    </div>
  );
}
