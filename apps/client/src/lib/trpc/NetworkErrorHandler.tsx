"use client";

import { useNetworkError } from "./useNetworkError";
import { NetworkErrorBanner } from "@/components/ui/NetworkErrorBanner";

/**
 * NetworkErrorHandler component
 * Integrates useNetworkError hook with NetworkErrorBanner UI
 * Should be placed inside TRPCProvider to access QueryClient
 */
export function NetworkErrorHandler() {
  const { error, isNetworkError, clearError } = useNetworkError();

  if (!isNetworkError || !error) {
    return null;
  }

  const handleRetry = () => {
    clearError();
  };

  const handleDismiss = () => {
    clearError();
  };

  // Extract user-friendly error message
  const getErrorMessage = (): string => {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      
      // Network connectivity errors
      if (
        message.includes("failed to fetch") ||
        message.includes("networkerror") ||
        message.includes("network request failed")
      ) {
        return "No se pudo conectar con el servidor. Verifica tu conexión a internet e intenta nuevamente.";
      }
      
      // CORS errors
      if (message.includes("cors")) {
        return "Error de conexión con el servidor. Por favor, intenta nuevamente en unos momentos.";
      }
      
      // Generic network error
      return "Error de conexión. Por favor, intenta nuevamente.";
    }
    
    // Default message
    return "No se pudo conectar con el servidor. Por favor, verifica tu conexión e intenta nuevamente.";
  };

  return (
    <NetworkErrorBanner
      message={getErrorMessage()}
      onRetry={handleRetry}
      onDismiss={handleDismiss}
    />
  );
}
