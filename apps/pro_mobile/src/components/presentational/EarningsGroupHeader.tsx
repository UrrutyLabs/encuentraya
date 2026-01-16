import { StyleSheet, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Text } from "@components/ui/Text";
import { formatAmount, formatMonthYear } from "../../utils/format";
import { theme } from "../../theme";

interface EarningsGroupHeaderProps {
  monthKey: string;
  totalNetAmount: number;
  currency: string;
  count: number;
}

export function EarningsGroupHeader({
  monthKey,
  totalNetAmount,
  currency,
  count,
}: EarningsGroupHeaderProps) {
  // Parse month key (e.g., "2024-01") to Date
  const [year, month] = monthKey.split("-").map(Number);
  const monthDate = new Date(year, month - 1, 1);
  const monthLabel = formatMonthYear(monthDate);

  return (
    <View style={styles.container}>
      <View style={styles.leftSection}>
        <Feather name="calendar" size={16} color={theme.colors.primary} />
        <Text variant="h3" style={styles.monthLabel}>
          {monthLabel}
        </Text>
      </View>
      <View style={styles.rightSection}>
        <Text variant="body" style={styles.totalAmount}>
          {formatAmount(totalNetAmount, currency)}
        </Text>
        <Text variant="small" style={styles.count}>
          {count} {count === 1 ? "ingreso" : "ingresos"}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: theme.spacing[3],
    paddingHorizontal: theme.spacing[4],
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  monthLabel: {
    marginLeft: theme.spacing[2],
    color: theme.colors.text,
  },
  rightSection: {
    alignItems: "flex-end",
  },
  totalAmount: {
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.primary,
  },
  count: {
    marginTop: 2,
    color: theme.colors.muted,
  },
});
