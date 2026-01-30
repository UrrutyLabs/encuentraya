"use client";

import { AlertCircle } from "lucide-react";
import { Card } from "@repo/ui";
import { Text } from "@repo/ui";
import { Button } from "@repo/ui";

/**
 * SearchError Component
 *
 * Displays an error message when search fails, with an optional retry button.
 *
 * @example
 * ```tsx
 * <SearchError error={error} onRetry={handleRetry} />
 * ```
 */
interface SearchErrorProps {
  /** The error to display */
  error: Error | null;
  /** Optional callback to retry the search */
  onRetry?: () => void;
}

export function SearchError({ error, onRetry }: SearchErrorProps) {
  if (!error) return null;

  return (
    <Card className="p-6 md:p-8 text-center">
      <div className="flex justify-center mb-4">
        <div className="w-16 h-16 rounded-full bg-danger/10 flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-danger" />
        </div>
      </div>
      <Text variant="h2" className="mb-2 text-text">
        Error al buscar profesionales
      </Text>
      <Text variant="body" className="text-muted mb-4">
        {error.message ||
          "Ocurrió un error inesperado. Por favor, intentá nuevamente."}
      </Text>
      {onRetry && (
        <Button onClick={onRetry} variant="primary">
          Reintentar
        </Button>
      )}
    </Card>
  );
}
