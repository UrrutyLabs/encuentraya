import { useState, useMemo } from "react";
import {
  StyleSheet,
  ScrollView,
  View,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { Card } from "@components/ui/Card";
import { Button } from "@components/ui/Button";
import { Text } from "@components/ui/Text";
import { CategoryRatesEditor } from "@components/presentational/CategoryRatesEditor";
import { useMyProProfile, useUpdateProfile } from "@hooks/pro";
import { useCategoryLookup } from "@hooks/category/useCategoryLookup";
import { toMinorUnits } from "@repo/domain";
import type { Category } from "@repo/domain";
import { theme } from "../../theme";

const RATE_MAX_MAJOR = 999999;

export function AddCategoryScreen() {
  const router = useRouter();
  const { data: pro, isLoading, refetch } = useMyProProfile();
  const updateMutation = useUpdateProfile();
  const { categories, isLoading: isLoadingCategories } = useCategoryLookup();

  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  );
  const [rateValue, setRateValue] = useState("");
  const [rateError, setRateError] = useState("");

  const availableCategories = useMemo(() => {
    const ids = new Set(pro?.categoryIds ?? []);
    return (categories as Category[]).filter(
      (c) => c.isActive && !c.deletedAt && !ids.has(c.id)
    );
  }, [categories, pro?.categoryIds]);

  const handleSave = () => {
    if (!selectedCategory || !pro?.categoryIds) return;

    const raw = rateValue.trim();
    const num = parseFloat(raw);
    if (!raw) {
      setRateError(
        selectedCategory.pricingMode === "fixed"
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
    const newCategoryRates =
      selectedCategory.pricingMode === "fixed"
        ? { categoryId: selectedCategory.id, startingFromCents: minor }
        : { categoryId: selectedCategory.id, hourlyRateCents: minor };

    const existingRates = (pro.categoryRelations ?? []).map((rel) => {
      const isHourly = rel.category?.pricingMode !== "fixed";
      const cents = isHourly ? rel.hourlyRateCents : rel.startingFromCents;
      if (cents == null) return { categoryId: rel.categoryId };
      return isHourly
        ? { categoryId: rel.categoryId, hourlyRateCents: cents }
        : { categoryId: rel.categoryId, startingFromCents: cents };
    });

    updateMutation.mutate(
      {
        categoryIds: [...pro.categoryIds, selectedCategory.id],
        categoryRates: [...existingRates, newCategoryRates],
      },
      {
        onSuccess: async () => {
          await refetch();
          Alert.alert(
            "Categoría agregada",
            "La categoría fue agregada correctamente.",
            [
              {
                text: "OK",
                onPress: () => router.replace("/profile/categories"),
              },
            ]
          );
        },
        onError: (error: { message?: string }) => {
          Alert.alert(
            "Error",
            error.message ?? "No se pudo agregar. Intentá nuevamente."
          );
        },
      }
    );
  };

  if (isLoading || isLoadingCategories) {
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

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.titleRow}>
        <Feather name="plus-circle" size={24} color={theme.colors.primary} />
        <Text variant="h1" style={styles.title}>
          Agregar categoría
        </Text>
      </View>

      {!selectedCategory ? (
        <>
          <Text variant="body" style={styles.subtitle}>
            Elegí una categoría para agregar a tus servicios.
          </Text>
          {availableCategories.length === 0 ? (
            <Card style={styles.card}>
              <Text variant="body" style={styles.emptyText}>
                Ya tenés todas las categorías disponibles.
              </Text>
              <Button
                variant="secondary"
                onPress={() => router.back()}
                style={styles.backBtn}
              >
                Volver
              </Button>
            </Card>
          ) : (
            <View style={styles.list}>
              {availableCategories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  onPress={() => setSelectedCategory(cat)}
                  style={styles.listItem}
                  activeOpacity={0.7}
                >
                  <Text variant="body" style={styles.listItemText}>
                    {cat.name}
                  </Text>
                  <Feather
                    name="chevron-right"
                    size={20}
                    color={theme.colors.muted}
                  />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </>
      ) : (
        <>
          <TouchableOpacity
            onPress={() => {
              setSelectedCategory(null);
              setRateValue("");
              setRateError("");
            }}
            style={styles.changeCategoryRow}
          >
            <Text variant="body" style={styles.changeCategoryText}>
              {selectedCategory.name}
            </Text>
            <Text variant="small" style={styles.changeCategoryLink}>
              Cambiar categoría
            </Text>
          </TouchableOpacity>

          <Card style={styles.card}>
            <CategoryRatesEditor
              selectedCategories={[selectedCategory]}
              rates={{ [selectedCategory.id]: rateValue }}
              onRatesChange={(id, value) => {
                setRateValue(value);
                if (rateError) setRateError("");
              }}
              errors={rateError ? { [selectedCategory.id]: rateError } : {}}
            />
          </Card>

          <Button
            onPress={handleSave}
            disabled={updateMutation.isPending}
            style={styles.saveButton}
          >
            {updateMutation.isPending ? "Agregando..." : "Agregar categoría"}
          </Button>
        </>
      )}
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
  subtitle: {
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
  card: {
    marginBottom: theme.spacing[4],
  },
  emptyText: {
    color: theme.colors.muted,
    marginBottom: theme.spacing[4],
  },
  backBtn: {
    marginTop: theme.spacing[2],
  },
  list: {
    marginBottom: theme.spacing[4],
  },
  listItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: theme.spacing[3],
    paddingHorizontal: theme.spacing[4],
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    marginBottom: theme.spacing[2],
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  listItemText: {
    color: theme.colors.text,
  },
  changeCategoryRow: {
    marginBottom: theme.spacing[4],
  },
  changeCategoryText: {
    color: theme.colors.text,
  },
  changeCategoryLink: {
    color: theme.colors.primary,
    marginTop: theme.spacing[1],
  },
  saveButton: {
    width: "100%",
  },
});
