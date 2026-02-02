import { useMemo } from "react";
import { StyleSheet, ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { Card } from "@components/ui/Card";
import { Button } from "@components/ui/Button";
import { Text } from "@components/ui/Text";
import { CategoryListRow } from "@components/presentational/CategoryListRow";
import { useMyProProfile } from "@hooks/pro";
import { useCategoryLookup } from "@hooks/category/useCategoryLookup";
import { theme } from "../../theme";

export function CategoriesListScreen() {
  const router = useRouter();
  const { data: pro, isLoading } = useMyProProfile();
  const { categoryMap, isLoading: isLoadingCategories } = useCategoryLookup();

  const myCategories = useMemo(() => {
    if (!pro?.categoryIds?.length) return [];
    return pro.categoryIds
      .map((categoryId) => {
        const rel = pro.categoryRelations?.find(
          (r) => r.categoryId === categoryId
        );
        const name =
          rel?.category?.name ??
          categoryMap.get(categoryId)?.name ??
          categoryId;
        return { categoryId, name };
      })
      .filter((c) => c.name);
  }, [pro?.categoryIds, pro?.categoryRelations, categoryMap]);

  if (isLoading || isLoadingCategories) {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        <View style={styles.loadingContainer}>
          <Feather name="loader" size={24} color={theme.colors.muted} />
          <Text variant="body" style={styles.loadingText}>
            Cargando categorías...
          </Text>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.titleRow}>
        <Feather name="briefcase" size={24} color={theme.colors.primary} />
        <Text variant="h1" style={styles.title}>
          Mis categorías
        </Text>
      </View>

      <Text variant="body" style={styles.subtitle}>
        Administrá tus categorías de servicio y tarifas.
      </Text>

      {myCategories.length === 0 ? (
        <Card style={styles.card}>
          <Text variant="body" style={styles.emptyText}>
            Aún no tenés categorías. Agregá una para empezar a recibir trabajos.
          </Text>
        </Card>
      ) : (
        myCategories.map(({ categoryId, name }) => (
          <CategoryListRow
            key={categoryId}
            categoryName={name}
            onEditPress={() =>
              router.push(`/profile/categories/${categoryId}/edit`)
            }
          />
        ))
      )}

      <Button
        variant="primary"
        onPress={() => router.push("/profile/categories/add")}
        style={styles.addButton}
      >
        Agregar categoría
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
    textAlign: "center",
  },
  addButton: {
    marginTop: theme.spacing[4],
    width: "100%",
  },
});
