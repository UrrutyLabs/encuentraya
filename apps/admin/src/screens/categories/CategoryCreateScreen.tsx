"use client";

import { useRouter } from "next/navigation";
import { Card } from "@repo/ui";
import { Text } from "@repo/ui";
import { CategoryForm } from "@/components/categories/CategoryForm";
import { useCreateCategory } from "@/hooks/useCategoryMutations";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import type { CategoryCreateInput, CategoryUpdateInput } from "@repo/domain";

export function CategoryCreateScreen() {
  const router = useRouter();
  const createCategory = useCreateCategory();

  const handleSubmit = async (
    data: CategoryCreateInput | CategoryUpdateInput
  ) => {
    // Ensure required fields for creation
    if (!("key" in data) || !data.key) {
      console.error("Category key is required for creation");
      return;
    }

    try {
      const result = await createCategory.mutateAsync(
        data as CategoryCreateInput
      );
      router.push(`/admin/categories/${result.id}`);
    } catch (error) {
      // Error handling is done by the mutation hook
      console.error("Error creating category:", error);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Categorías", href: "/admin/categories" },
          { label: "Crear" },
        ]}
      />
      <Text variant="h1">Crear Categoría</Text>

      <Card className="p-6">
        <CategoryForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={createCategory.isPending}
        />
      </Card>
    </div>
  );
}
