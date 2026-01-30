"use client";

import { Text } from "@repo/ui";
import { Card } from "@repo/ui";

interface LocationStepErrorsProps {
  hasCompleteState: boolean;
}

/**
 * Handles error state for LocationStep (incomplete previous steps)
 */
export function LocationStepErrors({
  hasCompleteState,
}: LocationStepErrorsProps) {
  if (hasCompleteState) return null;

  return (
    <Card className="p-4 md:p-6">
      <Text variant="h2" className="mb-2 text-text">
        Información incompleta
      </Text>
      <Text variant="body" className="text-muted">
        Por favor, completá los pasos anteriores primero.
      </Text>
    </Card>
  );
}
