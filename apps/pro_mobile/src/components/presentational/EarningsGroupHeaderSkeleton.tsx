import { StyleSheet, View } from "react-native";
import { theme } from "../../theme";

export function EarningsGroupHeaderSkeleton() {
  return (
    <View style={styles.container}>
      <View style={styles.leftSection}>
        <View style={styles.iconSkeleton} />
        <View style={styles.monthLabelSkeleton} />
      </View>
      <View style={styles.rightSection}>
        <View style={styles.totalAmountSkeleton} />
        <View style={styles.countSkeleton} />
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
  iconSkeleton: {
    width: 16,
    height: 16,
    borderRadius: 4,
    backgroundColor: theme.colors.border,
  },
  monthLabelSkeleton: {
    width: 120,
    height: 18,
    borderRadius: 4,
    backgroundColor: theme.colors.border,
    marginLeft: theme.spacing[2],
  },
  rightSection: {
    alignItems: "flex-end",
  },
  totalAmountSkeleton: {
    width: 80,
    height: 18,
    borderRadius: 4,
    backgroundColor: theme.colors.border,
  },
  countSkeleton: {
    width: 60,
    height: 14,
    borderRadius: 4,
    backgroundColor: theme.colors.border,
    marginTop: 2,
  },
});
