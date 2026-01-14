import { View, StyleSheet } from "react-native";
import { Card } from "../ui/Card";
import { theme } from "../../theme";

export function PayoutInfoSkeleton() {
  return (
    <View style={styles.container}>
      {/* Title Row */}
      <View style={styles.titleRow}>
        <View style={styles.iconPlaceholder} />
        <View style={styles.titlePlaceholder} />
      </View>

      {/* Status Card */}
      <Card style={styles.card}>
        <View style={styles.sectionHeader}>
          <View style={styles.iconSmallPlaceholder} />
          <View style={styles.sectionTitlePlaceholder} />
        </View>
        <View style={styles.statusRow}>
          <View style={styles.iconSmallPlaceholder} />
          <View style={styles.statusTextPlaceholder} />
        </View>
      </Card>

      {/* Form Fields Card */}
      <Card style={styles.card}>
        <View style={styles.sectionHeader}>
          <View style={styles.iconSmallPlaceholder} />
          <View style={styles.sectionTitlePlaceholder} />
        </View>

        {/* Input Skeletons */}
        {[...Array(4)].map((_, i) => (
          <View key={i} style={styles.inputContainer}>
            <View style={styles.labelRow}>
              <View style={styles.labelIconPlaceholder} />
              <View style={styles.labelPlaceholder} />
            </View>
            <View style={styles.inputPlaceholder} />
          </View>
        ))}
      </Card>

      {/* Save Button */}
      <View style={styles.buttonPlaceholder} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: theme.spacing[4],
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing[6],
  },
  iconPlaceholder: {
    width: 24,
    height: 24,
    borderRadius: 4,
    backgroundColor: `${theme.colors.muted}30`,
  },
  titlePlaceholder: {
    marginLeft: theme.spacing[2],
    width: 100,
    height: 28,
    borderRadius: 4,
    backgroundColor: `${theme.colors.muted}30`,
  },
  card: {
    marginBottom: theme.spacing[4],
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing[3],
  },
  iconSmallPlaceholder: {
    width: 20,
    height: 20,
    borderRadius: 4,
    backgroundColor: `${theme.colors.muted}30`,
  },
  sectionTitlePlaceholder: {
    marginLeft: theme.spacing[2],
    width: 150,
    height: 20,
    borderRadius: 4,
    backgroundColor: `${theme.colors.muted}30`,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusTextPlaceholder: {
    marginLeft: theme.spacing[2],
    width: 200,
    height: 18,
    borderRadius: 4,
    backgroundColor: `${theme.colors.muted}30`,
  },
  inputContainer: {
    marginBottom: theme.spacing[3],
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing[1],
  },
  labelIconPlaceholder: {
    width: 14,
    height: 14,
    borderRadius: 2,
    backgroundColor: `${theme.colors.muted}30`,
    marginRight: theme.spacing[1],
  },
  labelPlaceholder: {
    width: 120,
    height: 14,
    borderRadius: 4,
    backgroundColor: `${theme.colors.muted}30`,
  },
  inputPlaceholder: {
    width: "100%",
    height: 44,
    borderRadius: theme.radius.md,
    backgroundColor: `${theme.colors.muted}30`,
  },
  buttonPlaceholder: {
    width: "100%",
    height: 44,
    borderRadius: theme.radius.md,
    backgroundColor: `${theme.colors.muted}30`,
    marginTop: theme.spacing[2],
  },
});
