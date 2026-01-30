"use client";

import { Text } from "@repo/ui";
import { Card } from "@repo/ui";

interface ReviewStepErrorsProps {
  hasCompleteState: boolean;
  isLoadingPro: boolean;
}

/**
 * Handles error and loading states for ReviewStep (incomplete state, loading pro)
 */
export function ReviewStepErrors({
  hasCompleteState,
  isLoadingPro,
}: ReviewStepErrorsProps) {
  if (!hasCompleteState) {
    return (
      <Card className="p-6">
        <Text variant="h2" className="mb-2 text-text">
          Información incompleta
        </Text>
        <Text variant="body" className="text-muted">
          Por favor, completá todos los pasos anteriores.
        </Text>
      </Card>
    );
  }

  if (isLoadingPro) {
    return (
      <Card className="p-6">
        <Text variant="h2" className="mb-2 text-text">
          Cargando información...
        </Text>
      </Card>
    );
  }

  return null;
}
