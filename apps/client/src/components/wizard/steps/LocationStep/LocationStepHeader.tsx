"use client";

import { Text } from "@repo/ui";

/**
 * Presentational header for Location step: title + subtitle
 */
export function LocationStepHeader() {
  return (
    <div className="mb-6">
      <Text variant="h1" className="mb-2 text-primary">
        Ubicación y duración
      </Text>
      <Text variant="body" className="text-muted">
        Dónde y cuánto tiempo necesitás el servicio
      </Text>
    </div>
  );
}
