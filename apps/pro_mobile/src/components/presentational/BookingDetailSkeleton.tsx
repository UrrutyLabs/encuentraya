import { View, StyleSheet, ScrollView } from "react-native";
import { Card } from "../ui/Card";
import { theme } from "../../theme";

export function BookingDetailSkeleton() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titlePlaceholder} />
        <View style={styles.badgePlaceholder} />
      </View>

      {/* Summary Card */}
      <Card style={styles.card}>
        <View style={styles.sectionHeader}>
          <View style={styles.iconPlaceholder} />
          <View style={styles.sectionTitlePlaceholder} />
        </View>

        {/* Category Row */}
        <View style={styles.row}>
          <View style={styles.labelRow}>
            <View style={styles.iconSmallPlaceholder} />
            <View style={styles.labelPlaceholder} />
          </View>
          <View style={styles.valuePlaceholder} />
        </View>

        {/* Date Row */}
        <View style={styles.row}>
          <View style={styles.labelRow}>
            <View style={styles.iconSmallPlaceholder} />
            <View style={styles.labelPlaceholder} />
          </View>
          <View style={styles.valuePlaceholder} />
        </View>

        {/* Hours Row */}
        <View style={styles.row}>
          <View style={styles.labelRow}>
            <View style={styles.iconSmallPlaceholder} />
            <View style={styles.labelPlaceholder} />
          </View>
          <View style={styles.valuePlaceholderShort} />
        </View>

        {/* Description Row */}
        <View style={styles.row}>
          <View style={styles.labelRow}>
            <View style={styles.iconSmallPlaceholder} />
            <View style={styles.labelPlaceholder} />
          </View>
          <View style={styles.descriptionPlaceholder} />
          <View style={[styles.descriptionPlaceholder, styles.descriptionShort]} />
        </View>

        {/* Amount Row */}
        <View style={styles.row}>
          <View style={styles.labelRow}>
            <View style={styles.iconSmallPlaceholder} />
            <View style={styles.labelPlaceholder} />
          </View>
          <View style={styles.amountPlaceholder} />
        </View>
      </Card>

      {/* Actions Card */}
      <Card style={styles.card}>
        <View style={styles.sectionHeader}>
          <View style={styles.iconPlaceholder} />
          <View style={styles.sectionTitlePlaceholder} />
        </View>
        <View style={styles.buttonPlaceholder} />
        <View style={styles.buttonPlaceholder} />
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  content: {
    padding: theme.spacing[4],
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing[4],
  },
  titlePlaceholder: {
    width: 180,
    height: 32,
    borderRadius: 4,
    backgroundColor: `${theme.colors.muted}30`,
  },
  badgePlaceholder: {
    width: 100,
    height: 28,
    borderRadius: theme.radius.full,
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
  iconPlaceholder: {
    width: 20,
    height: 20,
    borderRadius: 4,
    backgroundColor: `${theme.colors.muted}30`,
  },
  sectionTitlePlaceholder: {
    marginLeft: theme.spacing[2],
    width: 120,
    height: 20,
    borderRadius: 4,
    backgroundColor: `${theme.colors.muted}30`,
  },
  row: {
    marginBottom: theme.spacing[3],
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing[1],
  },
  iconSmallPlaceholder: {
    width: 14,
    height: 14,
    borderRadius: 2,
    backgroundColor: `${theme.colors.muted}30`,
  },
  labelPlaceholder: {
    marginLeft: theme.spacing[1],
    width: 100,
    height: 14,
    borderRadius: 4,
    backgroundColor: `${theme.colors.muted}30`,
  },
  valuePlaceholder: {
    width: "100%",
    height: 18,
    borderRadius: 4,
    backgroundColor: `${theme.colors.muted}30`,
  },
  valuePlaceholderShort: {
    width: 60,
    height: 18,
    borderRadius: 4,
    backgroundColor: `${theme.colors.muted}30`,
  },
  descriptionPlaceholder: {
    width: "100%",
    height: 16,
    borderRadius: 4,
    backgroundColor: `${theme.colors.muted}30`,
    marginTop: theme.spacing[1],
  },
  descriptionShort: {
    width: "70%",
  },
  amountPlaceholder: {
    width: 120,
    height: 24,
    borderRadius: 4,
    backgroundColor: `${theme.colors.muted}30`,
    marginTop: theme.spacing[1],
  },
  buttonPlaceholder: {
    width: "100%",
    height: 44,
    borderRadius: theme.radius.md,
    backgroundColor: `${theme.colors.muted}30`,
    marginBottom: theme.spacing[2],
  },
});
