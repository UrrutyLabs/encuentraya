import { StyleSheet, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Card } from "@components/ui/Card";
import { Text } from "@components/ui/Text";
import { Badge } from "@components/ui/Badge";
import { formatAmount, getDaysUntil } from "../../utils/format";
import { theme } from "../../theme";

interface NextPayoutCardProps {
  amount: number;
  currency: string;
  availableDate?: Date | null;
  status: "available" | "pending" | "no_data";
}

/**
 * Format date to relative string
 */
function formatAvailabilityStatus(
  availableDate: Date | null | undefined,
  status: "available" | "pending" | "no_data"
): string {
  if (status === "available") {
    return "Disponible ahora";
  }
  if (status === "no_data") {
    return "Completá tus datos";
  }
  if (!availableDate) {
    return "Pendiente";
  }

  const days = getDaysUntil(availableDate);
  if (days <= 0) {
    return "Disponible ahora";
  }
  if (days === 1) {
    return "Disponible mañana";
  }
  return `Disponible en ${days} días`;
}

export function NextPayoutCard({
  amount,
  currency,
  availableDate,
  status,
}: NextPayoutCardProps) {
  const statusText = formatAvailabilityStatus(availableDate, status);
  const badgeVariant =
    status === "available"
      ? "success"
      : status === "no_data"
        ? "danger"
        : "warning";

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Feather
          name="arrow-down-circle"
          size={20}
          color={theme.colors.primary}
        />
        <Text variant="h2" style={styles.title}>
          Próximo pago
        </Text>
      </View>

      {status === "no_data" ? (
        <View style={styles.noDataContainer}>
          <Feather name="alert-circle" size={24} color={theme.colors.danger} />
          <Text variant="body" style={styles.noDataText}>
            Completá tus datos bancarios para poder recibir pagos
          </Text>
        </View>
      ) : (
        <>
          <View style={styles.amountContainer}>
            <Text variant="h1" style={styles.amount}>
              {formatAmount(amount, currency)}
            </Text>
          </View>
          <View style={styles.statusRow}>
            <Badge variant={badgeVariant}>{statusText}</Badge>
          </View>
        </>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: theme.spacing[4],
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing[3],
  },
  title: {
    marginLeft: theme.spacing[2],
    color: theme.colors.text,
  },
  amountContainer: {
    marginBottom: theme.spacing[2],
  },
  amount: {
    color: theme.colors.primary,
    fontWeight: theme.typography.weights.bold,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  noDataContainer: {
    alignItems: "center",
    paddingVertical: theme.spacing[2],
  },
  noDataText: {
    marginTop: theme.spacing[2],
    textAlign: "center",
    color: theme.colors.muted,
  },
});
