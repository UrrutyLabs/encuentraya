import { View, StyleSheet, ScrollView } from "react-native";
import { Card } from "../ui/Card";
import { theme } from "../../theme";

export function AvailabilitySkeleton() {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Title Row */}
      <View style={styles.titleRow}>
        <View style={styles.iconPlaceholder} />
        <View style={styles.titlePlaceholder} />
      </View>

      {/* Helper Text */}
      <View style={styles.helperTextPlaceholder} />

      {/* Card with Days */}
      <Card style={styles.card}>
        {[...Array(7)].map((_, index) => (
          <View
            key={index}
            style={[styles.dayRow, index === 6 && styles.lastDayRow]}
          >
            {/* Day Header with Switch */}
            <View style={styles.dayHeader}>
              <View style={styles.dayToggleRow}>
                <View style={styles.switchPlaceholder} />
                <View style={styles.dayLabelPlaceholder} />
              </View>
            </View>

            {/* Time Inputs (shown for some days) */}
            {index < 5 && (
              <View style={styles.timeInputsRow}>
                <View style={styles.timeInputContainer}>
                  <View style={styles.timeLabelPlaceholder} />
                  <View style={styles.timeInputPlaceholder} />
                </View>
                <View style={styles.timeInputContainer}>
                  <View style={styles.timeLabelPlaceholder} />
                  <View style={styles.timeInputPlaceholder} />
                </View>
              </View>
            )}
          </View>
        ))}
      </Card>

      {/* Save Button */}
      <View style={styles.saveButtonPlaceholder} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  contentContainer: {
    padding: theme.spacing[4],
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing[2],
  },
  iconPlaceholder: {
    width: 24,
    height: 24,
    borderRadius: 4,
    backgroundColor: `${theme.colors.muted}30`,
  },
  titlePlaceholder: {
    marginLeft: theme.spacing[2],
    width: 180,
    height: 28,
    borderRadius: 4,
    backgroundColor: `${theme.colors.muted}30`,
  },
  helperTextPlaceholder: {
    width: "100%",
    height: 16,
    borderRadius: 4,
    backgroundColor: `${theme.colors.muted}30`,
    marginBottom: theme.spacing[4],
  },
  card: {
    marginBottom: theme.spacing[4],
  },
  dayRow: {
    marginBottom: theme.spacing[4],
    paddingBottom: theme.spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  lastDayRow: {
    borderBottomWidth: 0,
    marginBottom: 0,
    paddingBottom: 0,
  },
  dayHeader: {
    marginBottom: theme.spacing[2],
  },
  dayToggleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  switchPlaceholder: {
    width: 51,
    height: 31,
    borderRadius: 16,
    backgroundColor: `${theme.colors.muted}30`,
  },
  dayLabelPlaceholder: {
    marginLeft: theme.spacing[2],
    width: 100,
    height: 18,
    borderRadius: 4,
    backgroundColor: `${theme.colors.muted}30`,
  },
  timeInputsRow: {
    flexDirection: "row",
    gap: theme.spacing[3],
    marginTop: theme.spacing[2],
  },
  timeInputContainer: {
    flex: 1,
  },
  timeLabelPlaceholder: {
    width: 50,
    height: 14,
    borderRadius: 4,
    backgroundColor: `${theme.colors.muted}30`,
    marginBottom: theme.spacing[1],
  },
  timeInputPlaceholder: {
    width: "100%",
    height: 44,
    borderRadius: theme.radius.md,
    backgroundColor: `${theme.colors.muted}30`,
  },
  saveButtonPlaceholder: {
    width: "100%",
    height: 48,
    borderRadius: theme.radius.md,
    backgroundColor: `${theme.colors.muted}30`,
    marginTop: theme.spacing[2],
  },
});
