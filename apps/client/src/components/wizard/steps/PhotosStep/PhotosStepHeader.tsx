"use client";

import { Text } from "@repo/ui";

/**
 * Presentational header for Photos step
 */
export function PhotosStepHeader() {
  return (
    <div className="mb-6">
      <Text variant="h1" className="mb-2 text-primary">
        Agregar fotos
      </Text>
      <Text variant="body" className="text-muted">
        Opcional. Subí fotos del trabajo a realizar (máx. 10, 5 MB cada una)
      </Text>
    </div>
  );
}
