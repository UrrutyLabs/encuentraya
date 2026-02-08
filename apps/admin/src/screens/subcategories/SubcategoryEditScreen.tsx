"use client";

import { useRouter } from "next/navigation";
import { Card } from "@repo/ui";
import { Text } from "@repo/ui";
import { SubcategoryForm } from "@/components/subcategories/SubcategoryForm";
import { useSubcategory } from "@/hooks/useSubcategories";
import { useUpdateSubcategory } from "@/hooks/useSubcategoryMutations";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { SubcategoryDetailSkeleton } from "@/components/presentational/SubcategoryDetailSkeleton";

interface SubcategoryEditScreenProps {
  subcategoryId: string;
}

export function SubcategoryEditScreen({
  subcategoryId,
}: SubcategoryEditScreenProps) {
  const router = useRouter();
  const { data: subcategory, isLoading } = useSubcategory(subcategoryId);
  const updateSubcategory = useUpdateSubcategory();

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
      await updateSubcategory.mutateAsync({
        id: subcategoryId,
        data: {
          name: data.name,
          slug: data.slug,
          imageUrl: data.imageUrl ?? null,
          description: data.description ?? null,
          displayOrder: data.displayOrder,
          isActive: data.isActive,
          configJson: data.configJson ?? null,
          searchKeywords: data.searchKeywords ?? [],
        },
      });
      router.push(`/admin/subcategories/${subcategoryId}`);
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  const handleCancel = () => {
    router.back();
  };

  if (isLoading) {
    return <SubcategoryDetailSkeleton />;
  }

  if (!subcategory) {
    return (
      <div className="space-y-6">
        <Text variant="h1">Subcategoría no encontrada</Text>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Subcategorías", href: "/admin/subcategories" },
          {
            label: subcategory.name,
            href: `/admin/subcategories/${subcategoryId}`,
          },
          { label: "Editar" },
        ]}
      />
      <Text variant="h1">Editar Subcategoría</Text>

      <Card className="p-6">
        <SubcategoryForm
          subcategory={subcategory}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={updateSubcategory.isPending}
        />
      </Card>
    </div>
  );
}
