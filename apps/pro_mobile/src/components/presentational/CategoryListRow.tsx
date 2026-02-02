import { StyleSheet, TouchableOpacity, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Card } from "@components/ui/Card";
import { Text } from "@components/ui/Text";
import { theme } from "../../theme";

export interface CategoryListRowProps {
  categoryName: string;
  onEditPress: () => void;
}

/**
 * Presentational row for a pro's category: name + edit icon.
 * Navigation is handled by parent via onEditPress.
 */
export function CategoryListRow({
  categoryName,
  onEditPress,
}: CategoryListRowProps) {
  return (
    <Card style={styles.card}>
      <TouchableOpacity
        onPress={onEditPress}
        style={styles.row}
        activeOpacity={0.7}
      >
        <Text variant="body" style={styles.name} numberOfLines={1}>
          {categoryName}
        </Text>
        <Feather name="edit-2" size={20} color={theme.colors.primary} />
      </TouchableOpacity>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: theme.spacing[2],
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  name: {
    flex: 1,
    color: theme.colors.text,
    marginRight: theme.spacing[2],
  },
});
