import { useState, useEffect } from "react";
import { StyleSheet, ScrollView, View, Alert } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { Card } from "@components/ui/Card";
import { Button } from "@components/ui/Button";
import { Text } from "@components/ui/Text";
import { CategoryRatesEditor } from "@components/presentational/CategoryRatesEditor";
import { useMyProProfile, useUpdateProfile } from "@hooks/pro";
import { useCategoryLookup } from "@hooks/category/useCategoryLookup";
import { toMinorUnits, toMajorUnits } from "@repo/domain";
import type { Category } from "@repo/domain";
import { theme } from "../../theme";

const RATE_MAX_MAJOR = 999999;

export function EditCategoryConfigScreen() {
  const router = useRouter();
  const { categoryId } = useLocalSearchParams<{ categoryId: string }>();
  const { data: pro, isLoading, refetch } = useMyProProfile();
  const updateMutation = useUpdateProfile();
  const { categoryMap, isLoading: isLoadingCategories } = useCategoryLookup();

  const [rateValue, setRateValue] = useState("");
  const [rateError, setRateError] = useState("");

  const category = categoryId ? categoryMap.get(categoryId) : undefined;

  useEffect(() => {
    if (!pro?.categoryRelations || !categoryId) return;
    const rel = pro.categoryRelations.find((r) => r.categoryId === categoryId);
    const isHourly = rel?.category?.pricingMode !== "fixed";
    const cents = isHourly ? rel?.hourlyRateCents : rel?.startingFromCents;
    setRateValue(cents != null && cents > 0 ? String(toMajorUnits(cents)) : "");
  }, [pro?.categoryRelations, categoryId]);

  const handleSave = () => {
    if (!categoryId || !category || !pro?.categoryIds?.length) return;

    const raw = rateValue.trim();
    const num = parseFloat(raw);
    if (!raw) {
      setRateError(
        category.pricingMode === "fixed"
          ? "El precio desde es requerido"
          : "La tarifa por hora es requerida"
      );
      return;
    }
    if (isNaN(num) || num <= 0) {
      setRateError("Debe ser un número mayor a 0");
      return;
    }
    if (num > RATE_MAX_MAJOR) {
      setRateError(`Máximo ${RATE_MAX_MAJOR}`);
      return;
    }
    setRateError("");

    const minor = toMinorUnits(num);
    const categoryRates = (pro.categoryRelations ?? []).map((rel) => {
      if (rel.categoryId === categoryId) {
        return category.pricingMode === "fixed"
          ? { categoryId: rel.categoryId, startingFromCents: minor }
          : { categoryId: rel.categoryId, hourlyRateCents: minor };
      }
      const isHourly = rel.category?.pricingMode !== "fixed";
      const cents = isHourly ? rel.hourlyRateCents : rel.startingFromCents;
      if (cents == null) return { categoryId: rel.categoryId };
      return isHourly
        ? { categoryId: rel.categoryId, hourlyRateCents: cents }
        : { categoryId: rel.categoryId, startingFromCents: cents };
    });

    updateMutation.mutate(
      {
        categoryIds: pro.categoryIds,
        categoryRates,
      },
      {
        onSuccess: async () => {
          await refetch();
          Alert.alert("Guardado", "La tarifa fue actualizada correctamente.", [
            { text: "OK", onPress: () => router.back() },
          ]);
        },
        onError: (error: { message?: string }) => {
          Alert.alert(
            "Error",
            error.message ?? "No se pudo guardar. Intentá nuevamente."
          );
        },
      }
    );
  };

  if (!categoryId || isLoading || isLoadingCategories) {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        <View style={styles.loadingContainer}>
          <Feather name="loader" size={24} color={theme.colors.muted} />
          <Text variant="body" style={styles.loadingText}>
            Cargando...
          </Text>
        </View>
      </ScrollView>
    );
  }

  if (!category) {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        <View style={styles.loadingContainer}>
          <Text variant="body" style={styles.loadingText}>
            Categoría no encontrada.
          </Text>
          <Button
            variant="secondary"
            onPress={() => router.back()}
            style={styles.backBtn}
          >
            Volver
          </Button>
        </View>
      </ScrollView>
    );
  }

  const selectedCategories: Category[] = [category];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.titleRow}>
        <Feather name="edit-2" size={24} color={theme.colors.primary} />
        <Text variant="h1" style={styles.title}>
          Editar tarifa
        </Text>
      </View>

      <Text variant="body" style={styles.categoryName}>
        {category.name}
      </Text>

      <Card style={styles.card}>
        <CategoryRatesEditor
          selectedCategories={selectedCategories}
          rates={{ [category.id]: rateValue }}
          onRatesChange={(id, value) => {
            setRateValue(value);
            if (rateError) setRateError("");
          }}
          errors={rateError ? { [category.id]: rateError } : {}}
        />
      </Card>

      <Button
        onPress={handleSave}
        disabled={updateMutation.isPending}
        style={styles.saveButton}
      >
        {updateMutation.isPending ? "Guardando..." : "Guardar cambios"}
      </Button>
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
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing[2],
  },
  title: {
    marginLeft: theme.spacing[2],
    color: theme.colors.primary,
  },
  categoryName: {
    color: theme.colors.muted,
    marginBottom: theme.spacing[4],
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: theme.spacing[8],
  },
  loadingText: {
    marginTop: theme.spacing[2],
    color: theme.colors.muted,
  },
  backBtn: {
    marginTop: theme.spacing[4],
  },
  card: {
    marginBottom: theme.spacing[4],
  },
  saveButton: {
    width: "100%",
  },
});
