"use client";

import { Text } from "@repo/ui";
import { Card } from "@repo/ui";

interface ServiceDetailsStepErrorsProps {
  isLoading?: boolean;
  hasProId?: boolean;
  hasPro?: boolean;
  hasCategory?: boolean;
}

/**
 * ServiceDetailsStepErrors Component
 *
 * Handles error and loading states for ServiceDetailsStep
 */
export function ServiceDetailsStepErrors({
  isLoading,
  hasProId,
  hasPro,
  hasCategory,
}: ServiceDetailsStepErrorsProps) {
  if (isLoading) {
    return (
      <Card className="p-6">
        <Text variant="h2" className="mb-2 text-text">
          Cargando...
        </Text>
      </Card>
    );
  }

  if (!hasProId) {
    return (
      <Card className="p-6">
        <Text variant="h2" className="mb-2 text-text">
          Profesional no especificado
        </Text>
        <Text variant="body" className="text-muted">
          Por favor, seleccioná un profesional desde la búsqueda.
        </Text>
      </Card>
    );
  }

  if (!hasPro) {
    return (
      <Card className="p-6">
        <Text variant="h2" className="mb-2 text-text">
          Profesional no encontrado
        </Text>
        <Text variant="body" className="text-muted">
          El profesional seleccionado no existe o fue eliminado.
        </Text>
      </Card>
    );
  }

  if (!hasCategory) {
    return (
      <Card className="p-6">
        <Text variant="h2" className="mb-2 text-text">
          Categoría requerida
        </Text>
        <Text variant="body" className="text-muted">
          Por favor, seleccioná una categoría desde la búsqueda de
          profesionales.
        </Text>
      </Card>
    );
  }

  return null;
}
