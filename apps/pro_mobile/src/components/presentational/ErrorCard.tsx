import { StyleSheet, View, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Card } from "@components/ui/Card";
import { Text } from "@components/ui/Text";
import { theme } from "../../theme";

interface ErrorCardProps {
  title: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorCard({ title, message, onRetry }: ErrorCardProps) {
  return (
    <Card style={styles.card}>
      <View style={styles.container}>
        <Feather name="alert-circle" size={24} color={theme.colors.danger} />
        <Text variant="h3" style={styles.title}>
          {title}
        </Text>
        {message && (
          <Text variant="small" style={styles.message}>
            {message}
          </Text>
        )}
        {onRetry && (
          <TouchableOpacity onPress={onRetry} style={styles.retryButton}>
            <Feather name="refresh-cw" size={16} color={theme.colors.primary} />
            <Text variant="small" style={styles.retryText}>
              Reintentar
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: theme.spacing[4],
  },
  container: {
    alignItems: "center",
    paddingVertical: theme.spacing[4],
  },
  title: {
    marginTop: theme.spacing[2],
    marginBottom: theme.spacing[1],
    color: theme.colors.text,
  },
  message: {
    color: theme.colors.muted,
    textAlign: "center",
    marginBottom: theme.spacing[3],
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: theme.spacing[3],
    paddingVertical: theme.spacing[2],
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  retryText: {
    marginLeft: theme.spacing[1],
    color: theme.colors.primary,
    fontWeight: theme.typography.weights.medium,
  },
});
