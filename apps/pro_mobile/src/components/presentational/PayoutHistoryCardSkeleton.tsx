import { StyleSheet, View } from "react-native";
import { Card } from "@components/ui/Card";
import { theme } from "../../theme";

export function PayoutHistoryCardSkeleton() {
  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={styles.iconSkeleton} />
        <View style={styles.titleSkeleton} />
      </View>
      {[1, 2, 3].map((i) => (
        <View key={i} style={styles.payoutRow}>
          <View style={styles.leftSection}>
            <View style={styles.dateSkeleton} />
            <View style={styles.amountSkeleton} />
          </View>
          <View style={styles.badgeSkeleton} />
        </View>
      ))}
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
  iconSkeleton: {
    width: 20,
    height: 20,
    borderRadius: 4,
    backgroundColor: theme.colors.border,
  },
  titleSkeleton: {
    width: 140,
    height: 20,
    borderRadius: 4,
    backgroundColor: theme.colors.border,
    marginLeft: theme.spacing[2],
  },
  payoutRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: theme.spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  leftSection: {
    flex: 1,
  },
  dateSkeleton: {
    width: 60,
    height: 14,
    borderRadius: 4,
    backgroundColor: theme.colors.border,
    marginBottom: theme.spacing[1],
  },
  amountSkeleton: {
    width: 80,
    height: 18,
    borderRadius: 4,
    backgroundColor: theme.colors.border,
  },
  badgeSkeleton: {
    width: 70,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.border,
  },
});
