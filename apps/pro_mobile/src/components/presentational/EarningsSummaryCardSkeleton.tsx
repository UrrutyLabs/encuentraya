import { StyleSheet, View } from "react-native";
import { Card } from "@components/ui/Card";
import { theme } from "../../theme";

export function EarningsSummaryCardSkeleton() {
  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={styles.iconSkeleton} />
        <View style={styles.titleSkeleton} />
      </View>
      <View style={styles.summaryGrid}>
        {[1, 2].map((i) => (
          <View key={i} style={styles.summaryItem}>
            <View style={styles.summaryItemHeader}>
              <View style={styles.iconSmallSkeleton} />
              <View style={styles.labelSkeleton} />
            </View>
            <View style={styles.amountSkeleton} />
          </View>
        ))}
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
  iconSkeleton: {
    width: 20,
    height: 20,
    borderRadius: 4,
    backgroundColor: theme.colors.border,
  },
  titleSkeleton: {
    width: 160,
    height: 20,
    borderRadius: 4,
    backgroundColor: theme.colors.border,
    marginLeft: theme.spacing[2],
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
  iconSmallSkeleton: {
    width: 16,
    height: 16,
    borderRadius: 4,
    backgroundColor: theme.colors.border,
  },
  labelSkeleton: {
    width: 70,
    height: 14,
    borderRadius: 4,
    backgroundColor: theme.colors.border,
    marginLeft: theme.spacing[1],
  },
  amountSkeleton: {
    width: 80,
    height: 24,
    borderRadius: 4,
    backgroundColor: theme.colors.border,
  },
});
