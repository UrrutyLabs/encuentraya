import { StyleSheet, View } from "react-native";
import { Card } from "@components/ui/Card";
import { theme } from "../../theme";

export function EarningsCardSkeleton() {
  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={styles.leftSection}>
          <View style={styles.dateRow}>
            <View style={styles.iconSmallSkeleton} />
            <View style={styles.dateSkeleton} />
          </View>
          <View style={styles.netAmountSkeleton} />
          <View style={styles.breakdown}>
            <View style={styles.breakdownTextSkeleton} />
            <View style={styles.breakdownTextSkeleton} />
          </View>
        </View>
        <View style={styles.rightSection}>
          <View style={styles.badgeSkeleton} />
          <View style={styles.chevronSkeleton} />
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: theme.spacing[3],
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  leftSection: {
    flex: 1,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing[1],
  },
  iconSmallSkeleton: {
    width: 14,
    height: 14,
    borderRadius: 4,
    backgroundColor: theme.colors.border,
  },
  dateSkeleton: {
    width: 50,
    height: 14,
    borderRadius: 4,
    backgroundColor: theme.colors.border,
    marginLeft: theme.spacing[1],
  },
  netAmountSkeleton: {
    width: 100,
    height: 24,
    borderRadius: 4,
    backgroundColor: theme.colors.border,
    marginBottom: theme.spacing[1],
  },
  breakdown: {
    marginTop: theme.spacing[1],
  },
  breakdownTextSkeleton: {
    width: 120,
    height: 14,
    borderRadius: 4,
    backgroundColor: theme.colors.border,
    marginTop: 2,
  },
  rightSection: {
    alignItems: "flex-end",
    marginLeft: theme.spacing[3],
  },
  badgeSkeleton: {
    width: 70,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.border,
  },
  chevronSkeleton: {
    width: 20,
    height: 20,
    borderRadius: 4,
    backgroundColor: theme.colors.border,
    marginTop: theme.spacing[2],
  },
});
