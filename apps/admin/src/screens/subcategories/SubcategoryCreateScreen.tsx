"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Card } from "@repo/ui";
import { Text } from "@repo/ui";
import { SubcategoryForm } from "@/components/subcategories/SubcategoryForm";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";

export function SubcategoryCreateScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoryId = searchParams.get("categoryId") || undefined;

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
    // TODO: Implement when subcategory.create endpoint is available
    alert(
      "La creación de subcategorías aún no está implementada. Por favor, espera a que se agreguen los endpoints de API."
    );
    console.log("Would create subcategory:", data);
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

      <Card className="p-6 border-warning/20 bg-warning/5">
        <Text variant="body" className="text-warning mb-4">
          ⚠️ La creación de subcategorías aún no está disponible. Los endpoints
          de API deben ser implementados primero.
        </Text>
      </Card>

      <Card className="p-6">
        <SubcategoryForm
          initialCategoryId={categoryId}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={false}
        />
      </Card>
    </div>
  );
}
