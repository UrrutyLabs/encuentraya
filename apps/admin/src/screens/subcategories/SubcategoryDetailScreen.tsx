"use client";

import { useRouter } from "next/navigation";
import { Card } from "@repo/ui";
import { Button } from "@repo/ui";
import { Text } from "@repo/ui";
import { Badge } from "@repo/ui";
import { useSubcategory } from "@/hooks/useSubcategories";
import { useCategory } from "@/hooks/useCategories";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { SubcategoryDetailSkeleton } from "@/components/presentational/SubcategoryDetailSkeleton";

interface SubcategoryDetailScreenProps {
  subcategoryId: string;
}

export function SubcategoryDetailScreen({
  subcategoryId,
}: SubcategoryDetailScreenProps) {
  const router = useRouter();
  const { data: subcategory, isLoading } = useSubcategory(subcategoryId);
  const { data: category } = useCategory(subcategory?.categoryId || "", {
    includeDeleted: true,
  });

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("es-UY", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
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
          { label: subcategory.name },
        ]}
      />
      <div className="flex items-center justify-between">
        <div>
          <Text variant="h1">{subcategory.name}</Text>
          <div className="flex items-center gap-2 mt-2">
            <Badge
              variant={subcategory.isActive ? "success" : "warning"}
              showIcon
            >
              {subcategory.isActive ? "Activa" : "Inactiva"}
            </Badge>
            {category && (
              <Badge variant="info" showIcon>
                {category.name}
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => router.back()}>
            Volver
          </Button>
          <Button
            onClick={() =>
              router.push(`/admin/subcategories/${subcategoryId}/edit`)
            }
          >
            Editar
          </Button>
        </div>
      </div>

      {/* Subcategory Information */}
      <Card className="p-6">
        <Text variant="h2" className="mb-4">
          Información
        </Text>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Text variant="small" className="text-gray-600">
              Nombre
            </Text>
            <Text variant="body">{subcategory.name}</Text>
          </div>
          <div>
            <Text variant="small" className="text-gray-600">
              Categoría
            </Text>
            <Text variant="body">
              {category ? (
                <button
                  onClick={() =>
                    router.push(`/admin/categories/${category.id}`)
                  }
                  className="text-primary hover:underline"
                >
                  {category.name}
                </button>
              ) : (
                "Cargando..."
              )}
            </Text>
          </div>
          <div>
            <Text variant="small" className="text-gray-600">
              Slug
            </Text>
            <Text variant="body">{subcategory.slug}</Text>
          </div>
          <div>
            <Text variant="small" className="text-gray-600">
              Orden de visualización
            </Text>
            <Text variant="body">{subcategory.displayOrder}</Text>
          </div>
          {subcategory.imageUrl && (
            <div className="md:col-span-2">
              <Text variant="small" className="text-gray-600">
                URL de imagen
              </Text>
              <Text variant="body">{subcategory.imageUrl}</Text>
            </div>
          )}
          {subcategory.description && (
            <div className="md:col-span-2">
              <Text variant="small" className="text-gray-600">
                Descripción
              </Text>
              <Text variant="body">{subcategory.description}</Text>
            </div>
          )}
          <div>
            <Text variant="small" className="text-gray-600">
              Creada
            </Text>
            <Text variant="body">{formatDate(subcategory.createdAt)}</Text>
          </div>
          <div>
            <Text variant="small" className="text-gray-600">
              Última actualización
            </Text>
            <Text variant="body">{formatDate(subcategory.updatedAt)}</Text>
          </div>
        </div>
      </Card>
    </div>
  );
}
