import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Text } from "../ui/Text";
import { Badge } from "../ui/Badge";
import { theme } from "../../theme";
import { Category } from "@repo/domain";

interface CategorySelectorProps {
  categories: Category[];
  selected: Category[];
  onSelectionChange: (categories: Category[]) => void;
  isLoading?: boolean;
}

export function CategorySelector({
  categories,
  selected,
  onSelectionChange,
  isLoading = false,
}: CategorySelectorProps) {
  const toggleCategory = (category: Category) => {
    const isSelected = selected.some((c) => c.id === category.id);
    if (isSelected) {
      // Remove category if already selected
      onSelectionChange(selected.filter((c) => c.id !== category.id));
    } else {
      // Add category if not selected
      onSelectionChange([...selected, category]);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text variant="small" style={styles.label}>
          Categorías de servicio *
        </Text>
        <ActivityIndicator size="small" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text variant="small" style={styles.label}>
        Categorías de servicio *
      </Text>
      <View style={styles.categoriesContainer}>
        {categories
          .filter(
            (category: Category) => category.isActive && !category.deletedAt
          )
          .map((category: Category) => {
            const isSelected = selected.some((c) => c.id === category.id);
            return (
              <TouchableOpacity
                key={category.id}
                onPress={() => toggleCategory(category)}
                style={[
                  styles.categoryButton,
                  isSelected && styles.categoryButtonSelected,
                ]}
              >
                <Badge
                  variant={isSelected ? "success" : "info"}
                  style={styles.badge}
                >
                  {category.name}
                </Badge>
              </TouchableOpacity>
            );
          })}
      </View>
      {selected.length === 0 && (
        <Text variant="small" style={styles.errorText}>
          Seleccioná al menos una categoría
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing[4],
  },
  label: {
    marginBottom: theme.spacing[2],
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.text,
  },
  categoriesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing[2],
  },
  categoryButton: {
    marginBottom: theme.spacing[2],
  },
  categoryButtonSelected: {
    opacity: 1,
  },
  badge: {
    paddingHorizontal: theme.spacing[3],
    paddingVertical: theme.spacing[1],
  },
  errorText: {
    color: theme.colors.danger,
    marginTop: theme.spacing[1],
  },
});
