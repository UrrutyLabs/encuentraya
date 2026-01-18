"use client";

import { AlertCircle, X, RefreshCw } from "lucide-react";
import { Button } from "@repo/ui";
import { Text } from "@repo/ui";

interface NetworkErrorBannerProps {
  /**
   * Error message to display
   */
  message?: string;
  /**
   * Callback when user clicks retry
   */
  onRetry?: () => void;
  /**
   * Callback when user dismisses the banner
   */
  onDismiss?: () => void;
}

/**
 * Presentational component for displaying network/server errors
 * Shows a banner at the top of the screen with error message and retry/dismiss actions
 */
export function NetworkErrorBanner({
  message = "No se pudo conectar con el servidor. Por favor, verifica tu conexión e intenta nuevamente.",
  onRetry,
  onDismiss,
}: NetworkErrorBannerProps) {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-danger/95 backdrop-blur-sm border-b border-danger/20 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <AlertCircle className="w-5 h-5 text-white shrink-0" />
            <Text variant="small" className="text-white flex-1">
              {message}
            </Text>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {onRetry && (
              <Button
                variant="secondary"
                onClick={onRetry}
                className="px-3 py-1.5 text-sm bg-white/20 hover:bg-white/30 text-white border-white/30"
              >
                <RefreshCw className="w-4 h-4 mr-1.5" />
                Reintentar
              </Button>
            )}
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="p-1.5 rounded-md hover:bg-white/20 text-white transition-colors"
                aria-label="Cerrar"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
