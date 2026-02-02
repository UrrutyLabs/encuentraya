import React from "react";
import { View, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Input } from "@components/ui/Input";
import { Text } from "@components/ui/Text";
import { theme } from "../../theme";
import type { Category } from "@repo/domain";

const RATE_MAX_MAJOR = 999999;

interface CategoryRatesEditorProps {
  selectedCategories: Category[];
  /** Display value per categoryId (major units as string for input) */
  rates: Record<string, string>;
  onRatesChange: (categoryId: string, value: string) => void;
  errors?: Record<string, string>;
}

export function CategoryRatesEditor({
  selectedCategories,
  rates,
  onRatesChange,
  errors = {},
}: CategoryRatesEditorProps) {
  if (selectedCategories.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text variant="small" style={styles.label}>
        Tarifas por categoría *
      </Text>
      {selectedCategories.map((category) => {
        const isHourly = category.pricingMode !== "fixed";
        const label = isHourly
          ? `Tarifa por hora (UYU) * – ${category.name}`
          : `Precio desde (UYU) * – ${category.name}`;
        const value = rates[category.id] ?? "";
        const error = errors[category.id];

        return (
          <View key={category.id} style={styles.inputRow}>
            <Input
              label={label}
              icon="dollar-sign"
              value={value}
              onChangeText={(text) => {
                const sanitized = text.replace(/[^0-9.]/g, "");
                const num = parseFloat(sanitized);
                if (
                  sanitized === "" ||
                  (!isNaN(num) && num <= RATE_MAX_MAJOR)
                ) {
                  onRatesChange(category.id, sanitized);
                }
              }}
              placeholder="Ej: 1000"
              keyboardType="numeric"
              style={styles.input}
            />
            {error ? (
              <View style={styles.errorContainer}>
                <Feather
                  name="alert-circle"
                  size={14}
                  color={theme.colors.danger}
                />
                <Text variant="small" style={styles.error}>
                  {error}
                </Text>
              </View>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing[4],
  },
  label: {
    marginBottom: theme.spacing[2],
    fontWeight: "500",
    color: theme.colors.text,
  },
  inputRow: {
    marginBottom: theme.spacing[2],
  },
  input: {
    marginBottom: theme.spacing[1],
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing[2],
    marginTop: -theme.spacing[1],
  },
  error: {
    marginLeft: theme.spacing[1],
    color: theme.colors.danger,
  },
});
