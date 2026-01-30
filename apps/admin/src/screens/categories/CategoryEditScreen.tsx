"use client";

import { useRouter } from "next/navigation";
import { Card } from "@repo/ui";
import { Text } from "@repo/ui";
import { CategoryForm } from "@/components/categories/CategoryForm";
import { useCategory } from "@/hooks/useCategories";
import { useUpdateCategory } from "@/hooks/useCategoryMutations";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import type { CategoryUpdateInput } from "@repo/domain";
import { CategoryDetailSkeleton } from "@/components/presentational/CategoryDetailSkeleton";

interface CategoryEditScreenProps {
  categoryId: string;
}

export function CategoryEditScreen({ categoryId }: CategoryEditScreenProps) {
  const router = useRouter();
  const { data: category, isLoading } = useCategory(categoryId);
  const updateCategory = useUpdateCategory();

  const handleSubmit = async (data: CategoryUpdateInput) => {
    try {
      await updateCategory.mutateAsync({
        id: categoryId,
        data,
      });
      router.push(`/admin/categories/${categoryId}`);
    } catch (error) {
      // Error handling is done by the mutation hook
      console.error("Error updating category:", error);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  if (isLoading) {
    return <CategoryDetailSkeleton />;
  }

  if (!category) {
    return (
      <div className="space-y-6">
        <Text variant="h1">Categoría no encontrada</Text>
      </div>
    );
  }

  if (category.deletedAt) {
    return (
      <div className="space-y-6">
        <Text variant="h1">Categoría Eliminada</Text>
        <Card className="p-6">
          <Text variant="body" className="text-muted">
            No se puede editar una categoría eliminada. Primero debe
            restaurarla.
          </Text>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Categorías", href: "/admin/categories" },
          { label: category.name, href: `/admin/categories/${categoryId}` },
          { label: "Editar" },
        ]}
      />
      <Text variant="h1">Editar Categoría</Text>

      <Card className="p-6">
        <CategoryForm
          category={category}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={updateCategory.isPending}
        />
      </Card>
    </div>
  );
}
