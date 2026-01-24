import { View, StyleSheet } from "react-native";
import { Card } from "../ui/Card";
import { theme } from "../../theme";

export function JobsSkeleton() {
  return (
    <View style={styles.container}>
      {/* Próximos Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.iconPlaceholder} />
          <View style={styles.titlePlaceholder} />
        </View>
        {[...Array(2)].map((_, i) => (
          <Card key={`upcoming-${i}`} style={styles.card}>
            <View style={styles.header}>
              <View style={styles.categoryPlaceholder} />
              <View style={styles.badgePlaceholder} />
            </View>
            <View style={styles.descriptionPlaceholder} />
            <View
              style={[styles.descriptionPlaceholder, styles.descriptionShort]}
            />
            <View style={styles.dateRow}>
              <View style={styles.iconSmallPlaceholder} />
              <View style={styles.datePlaceholder} />
            </View>
            <View style={styles.amountRow}>
              <View style={styles.iconSmallPlaceholder} />
              <View style={styles.amountPlaceholder} />
            </View>
          </Card>
        ))}
      </View>

      {/* Completados Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.iconPlaceholder} />
          <View style={styles.titlePlaceholder} />
        </View>
        {[...Array(2)].map((_, i) => (
          <Card key={`completed-${i}`} style={styles.card}>
            <View style={styles.header}>
              <View style={styles.categoryPlaceholder} />
              <View style={styles.badgePlaceholder} />
            </View>
            <View style={styles.descriptionPlaceholder} />
            <View
              style={[styles.descriptionPlaceholder, styles.descriptionShort]}
            />
            <View style={styles.dateRow}>
              <View style={styles.iconSmallPlaceholder} />
              <View style={styles.datePlaceholder} />
            </View>
            <View style={styles.amountRow}>
              <View style={styles.iconSmallPlaceholder} />
              <View style={styles.amountPlaceholder} />
            </View>
          </Card>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: theme.spacing[4],
  },
  section: {
    marginBottom: theme.spacing[6],
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
  titlePlaceholder: {
    marginLeft: theme.spacing[2],
    width: 100,
    height: 20,
    borderRadius: 4,
    backgroundColor: `${theme.colors.muted}30`,
  },
  card: {
    marginBottom: theme.spacing[3],
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing[2],
  },
  categoryPlaceholder: {
    flex: 1,
    height: 20,
    borderRadius: 4,
    backgroundColor: `${theme.colors.muted}30`,
    marginRight: theme.spacing[2],
  },
  badgePlaceholder: {
    width: 80,
    height: 24,
    borderRadius: theme.radius.full,
    backgroundColor: `${theme.colors.muted}30`,
  },
  descriptionPlaceholder: {
    height: 16,
    borderRadius: 4,
    backgroundColor: `${theme.colors.muted}30`,
    marginBottom: theme.spacing[1],
  },
  descriptionShort: {
    width: "60%",
  },
  dateRow: {
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
  datePlaceholder: {
    marginLeft: theme.spacing[1],
    width: 150,
    height: 14,
    borderRadius: 4,
    backgroundColor: `${theme.colors.muted}30`,
  },
  amountRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: theme.spacing[1],
  },
  amountPlaceholder: {
    marginLeft: theme.spacing[1],
    width: 120,
    height: 18,
    borderRadius: 4,
    backgroundColor: `${theme.colors.muted}30`,
  },
});
