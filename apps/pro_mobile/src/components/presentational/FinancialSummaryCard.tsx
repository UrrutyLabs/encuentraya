import { StyleSheet, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Card } from "@components/ui/Card";
import { Text } from "@components/ui/Text";
import { formatAmount } from "../../utils/format";
import { theme } from "../../theme";

interface FinancialSummaryCardProps {
  available: number;
  pending: number;
  totalPaid: number;
  currency: string;
}

export function FinancialSummaryCard({
  available,
  pending,
  totalPaid,
  currency,
}: FinancialSummaryCardProps) {
  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Feather name="trending-up" size={20} color={theme.colors.primary} />
        <Text variant="h2" style={styles.title}>
          Resumen financiero
        </Text>
      </View>

      <View style={styles.summaryGrid}>
        {/* Available Amount */}
        <View style={styles.summaryItem}>
          <View style={styles.summaryItemHeader}>
            <Feather
              name="check-circle"
              size={16}
              color={theme.colors.success}
            />
            <Text variant="small" style={styles.summaryLabel}>
              Disponible
            </Text>
          </View>
          <Text
            variant="h2"
            style={[styles.summaryAmount, styles.successAmount]}
          >
            {formatAmount(available, currency)}
          </Text>
        </View>

        {/* Pending Amount */}
        <View style={styles.summaryItem}>
          <View style={styles.summaryItemHeader}>
            <Feather name="clock" size={16} color={theme.colors.warning} />
            <Text variant="small" style={styles.summaryLabel}>
              Pendiente
            </Text>
          </View>
          <Text
            variant="h2"
            style={[styles.summaryAmount, styles.warningAmount]}
          >
            {formatAmount(pending, currency)}
          </Text>
        </View>

        {/* Total Paid */}
        <View style={styles.summaryItem}>
          <View style={styles.summaryItemHeader}>
            <Feather
              name="dollar-sign"
              size={16}
              color={theme.colors.primary}
            />
            <Text variant="small" style={styles.summaryLabel}>
              Total cobrado
            </Text>
          </View>
          <Text
            variant="h2"
            style={[styles.summaryAmount, styles.primaryAmount]}
          >
            {formatAmount(totalPaid, currency)}
          </Text>
        </View>
      </View>
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
    marginBottom: theme.spacing[4],
  },
  title: {
    marginLeft: theme.spacing[2],
    color: theme.colors.text,
  },
  summaryGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: theme.spacing[3],
  },
  summaryItem: {
    flex: 1,
    alignItems: "flex-start",
  },
  summaryItemHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing[1],
  },
  summaryLabel: {
    marginLeft: theme.spacing[1],
    color: theme.colors.muted,
  },
  summaryAmount: {
    fontWeight: theme.typography.weights.bold,
  },
  successAmount: {
    color: theme.colors.success,
  },
  warningAmount: {
    color: theme.colors.warning,
  },
  primaryAmount: {
    color: theme.colors.primary,
  },
});
