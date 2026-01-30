"use client";

import { Text } from "@repo/ui";

/**
 * Presentational header for Review step: title + subtitle
 */
export function ReviewStepHeader() {
  return (
    <div className="mb-4 md:mb-6">
      <Text variant="h1" className="mb-2 text-primary">
        Revisar y confirmar
      </Text>
      <Text variant="body" className="text-muted">
        Revisá los detalles antes de confirmar tu trabajo
      </Text>
    </div>
  );
}
