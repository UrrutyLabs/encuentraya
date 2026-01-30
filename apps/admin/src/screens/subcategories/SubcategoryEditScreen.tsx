"use client";

import { useRouter } from "next/navigation";
import { Card } from "@repo/ui";
import { Text } from "@repo/ui";
import { SubcategoryForm } from "@/components/subcategories/SubcategoryForm";
import { useSubcategory } from "@/hooks/useSubcategories";
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

  const handleSubmit = async (data: {
    name: string;
    slug: string;
    categoryId: string;
    imageUrl?: string | null;
    description?: string | null;
    displayOrder: number;
    isActive: boolean;
    configJson?: Record<string, unknown> | null;
  }) => {
    // TODO: Implement when subcategory.update endpoint is available
    alert(
      "La actualización de subcategorías aún no está implementada. Por favor, espera a que se agreguen los endpoints de API."
    );
    console.log("Would update subcategory:", subcategoryId, data);
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

      <Card className="p-6 border-warning/20 bg-warning/5">
        <Text variant="body" className="text-warning mb-4">
          ⚠️ La actualización de subcategorías aún no está disponible. Los
          endpoints de API deben ser implementados primero.
        </Text>
      </Card>

      <Card className="p-6">
        <SubcategoryForm
          subcategory={subcategory}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={false}
        />
      </Card>
    </div>
  );
}
