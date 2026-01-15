"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button, Card, Text } from "@repo/ui";
import { logger } from "@/lib/logger";
import { captureException } from "@/lib/crash-reporting";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Global Error Boundary component
 * Catches React component errors and prevents full app crashes
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error
    logger.error("React Error Boundary caught an error", error, {
      componentStack: errorInfo.componentStack,
    });

    // Report to crash reporting service
    captureException(error, {
      componentStack: errorInfo.componentStack,
      errorBoundary: true,
    });

    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    logger.info("Error boundary reset by user");
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      const isDevelopment = process.env.NODE_ENV === "development";

      return (
        <div className="min-h-screen flex items-center justify-center bg-bg p-4">
          <Card className="max-w-md w-full">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="p-4 bg-danger/10 rounded-full">
                <AlertCircle className="w-12 h-12 text-danger" />
              </div>
              <div className="space-y-2">
                <Text variant="h1" className="text-text">
                  Algo salió mal
                </Text>
                <Text variant="body" className="text-muted">
                  Ocurrió un error inesperado. Por favor, intentá nuevamente.
                </Text>
              </div>
              {isDevelopment && this.state.error && (
                <div className="w-full p-4 bg-surface rounded-lg text-left">
                  <Text variant="small" className="font-mono text-danger text-xs break-all">
                    {this.state.error.toString()}
                  </Text>
                  {this.state.errorInfo && (
                    <Text variant="small" className="font-mono text-danger text-xs mt-2 break-all whitespace-pre-wrap">
                      {this.state.errorInfo.componentStack}
                    </Text>
                  )}
                </div>
              )}
              <Button variant="primary" onClick={this.handleReset} className="w-full">
                <RefreshCw className="w-4 h-4 mr-2" />
                Reintentar
              </Button>
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
