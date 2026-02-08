"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Card } from "@repo/ui";
import { Text } from "@repo/ui";
import { SubcategoryForm } from "@/components/subcategories/SubcategoryForm";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { useCreateSubcategory } from "@/hooks/useSubcategoryMutations";

export function SubcategoryCreateScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoryId = searchParams.get("categoryId") || undefined;
  const createSubcategory = useCreateSubcategory();

  const handleSubmit = async (data: {
    name: string;
    slug: string;
    categoryId: string;
    imageUrl?: string | null;
    description?: string | null;
    displayOrder: number;
    isActive: boolean;
    configJson?: Record<string, unknown> | null;
    searchKeywords?: string[];
  }) => {
    try {
      const created = await createSubcategory.mutateAsync({
        name: data.name,
        slug: data.slug,
        categoryId: data.categoryId,
        imageUrl: data.imageUrl ?? null,
        description: data.description ?? null,
        displayOrder: data.displayOrder,
        isActive: data.isActive,
        configJson: data.configJson ?? null,
        searchKeywords: data.searchKeywords ?? [],
      });
      router.push(`/admin/subcategories/${created.id}`);
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Subcategorías", href: "/admin/subcategories" },
          { label: "Crear" },
        ]}
      />
      <Text variant="h1">Crear Subcategoría</Text>

      <Card className="p-6">
        <SubcategoryForm
          initialCategoryId={categoryId}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={createSubcategory.isPending}
        />
      </Card>
    </div>
  );
}
