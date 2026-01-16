import { StyleSheet, View } from "react-native";
import { Card } from "@components/ui/Card";
import { theme } from "../../theme";

export function NextPayoutCardSkeleton() {
  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={styles.iconSkeleton} />
        <View style={styles.titleSkeleton} />
      </View>
      <View style={styles.amountSkeleton} />
      <View style={styles.badgeSkeleton} />
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
    width: 120,
    height: 20,
    borderRadius: 4,
    backgroundColor: theme.colors.border,
    marginLeft: theme.spacing[2],
  },
  amountSkeleton: {
    width: 100,
    height: 32,
    borderRadius: 4,
    backgroundColor: theme.colors.border,
    marginBottom: theme.spacing[2],
  },
  badgeSkeleton: {
    width: 120,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.border,
  },
});
