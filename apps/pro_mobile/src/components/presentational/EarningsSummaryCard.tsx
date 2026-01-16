import { StyleSheet, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Card } from "@components/ui/Card";
import { Text } from "@components/ui/Text";
import { formatAmount } from "../../utils/format";
import { theme } from "../../theme";

interface EarningsSummaryCardProps {
  thisMonthTotal: number;
  lastMonthTotal: number;
  currency: string;
}

export function EarningsSummaryCard({
  thisMonthTotal,
  lastMonthTotal,
  currency,
}: EarningsSummaryCardProps) {
  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Feather name="trending-up" size={20} color={theme.colors.primary} />
        <Text variant="h2" style={styles.title}>
          Resumen por período
        </Text>
      </View>

      <View style={styles.summaryGrid}>
        {/* This Month */}
        <View style={styles.summaryItem}>
          <View style={styles.summaryItemHeader}>
            <Feather name="calendar" size={16} color={theme.colors.primary} />
            <Text variant="small" style={styles.summaryLabel}>
              Este mes
            </Text>
          </View>
          <Text variant="h2" style={[styles.summaryAmount, styles.primaryAmount]}>
            {formatAmount(thisMonthTotal, currency)}
          </Text>
        </View>

        {/* Last Month */}
        <View style={styles.summaryItem}>
          <View style={styles.summaryItemHeader}>
            <Feather name="calendar" size={16} color={theme.colors.muted} />
            <Text variant="small" style={styles.summaryLabel}>
              Mes pasado
            </Text>
          </View>
          <Text variant="h2" style={[styles.summaryAmount, styles.mutedAmount]}>
            {formatAmount(lastMonthTotal, currency)}
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
  primaryAmount: {
    color: theme.colors.primary,
  },
  mutedAmount: {
    color: theme.colors.muted,
  },
});
