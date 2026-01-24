"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import { Button } from "@repo/ui";
import { Text } from "@repo/ui";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to Sentry (only in production)
    if (process.env.NODE_ENV !== "production") {
      return;
    }

    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="min-h-screen bg-bg flex items-center justify-center px-4">
          <div className="max-w-md w-full text-center">
            <Text variant="h1" className="mb-4 text-danger">
              Algo salió mal
            </Text>
            <Text variant="body" className="mb-6 text-muted">
              Ocurrió un error inesperado. Por favor, intenta nuevamente.
            </Text>
            {process.env.NODE_ENV === "development" && (
              <div className="mb-6 p-4 bg-surface rounded-lg text-left">
                <Text
                  variant="small"
                  className="text-muted font-mono break-all"
                >
                  {error.message}
                </Text>
              </div>
            )}
            <div className="flex gap-4 justify-center">
              <Button variant="primary" onClick={reset}>
                Intentar de nuevo
              </Button>
              <Button
                variant="ghost"
                onClick={() => (window.location.href = "/")}
              >
                Ir al inicio
              </Button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
