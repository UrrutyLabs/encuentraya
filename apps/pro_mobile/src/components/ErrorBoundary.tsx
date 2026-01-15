import React, { Component, ErrorInfo, ReactNode } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Text } from "./ui/Text";
import { Button } from "./ui/Button";
import { theme } from "../theme";
import { logger } from "../lib/logger";
import { captureException } from "../lib/crash-reporting";

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
      return (
        <View style={styles.container}>
          <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.iconContainer}>
              <Feather name="alert-circle" size={64} color={theme.colors.danger} />
            </View>
            <Text variant="h1" style={styles.title}>
              Algo salió mal
            </Text>
            <Text variant="body" style={styles.message}>
              Ocurrió un error inesperado. Por favor, intentá nuevamente.
            </Text>
            {__DEV__ && this.state.error && (
              <View style={styles.errorDetails}>
                <Text variant="small" style={styles.errorText}>
                  {this.state.error.toString()}
                </Text>
                {this.state.errorInfo && (
                  <Text variant="small" style={styles.errorText}>
                    {this.state.errorInfo.componentStack}
                  </Text>
                )}
              </View>
            )}
            <Button variant="primary" onPress={this.handleReset} style={styles.button}>
              Reintentar
            </Button>
          </ScrollView>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: theme.spacing[4],
  },
  iconContainer: {
    marginBottom: theme.spacing[4],
  },
  title: {
    marginBottom: theme.spacing[2],
    textAlign: "center",
    color: theme.colors.text,
  },
  message: {
    marginBottom: theme.spacing[4],
    textAlign: "center",
    color: theme.colors.muted,
  },
  errorDetails: {
    width: "100%",
    marginBottom: theme.spacing[4],
    padding: theme.spacing[3],
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    maxHeight: 200,
  },
  errorText: {
    fontFamily: "monospace",
    color: theme.colors.danger,
    fontSize: 10,
  },
  button: {
    minWidth: 200,
  },
});
