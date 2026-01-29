"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@repo/ui";
import { Button } from "@repo/ui";
import { Text } from "@repo/ui";
import { Badge } from "@repo/ui";
import { useCategory } from "@/hooks/useCategories";
import { useSubcategories } from "@/hooks/useSubcategories";
import {
  useDeleteCategory,
  useRestoreCategory,
} from "@/hooks/useCategoryMutations";
import { ConfirmModal } from "@/components/modals/ConfirmModal";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { CategoryDetailSkeleton } from "@/components/presentational/CategoryDetailSkeleton";

interface CategoryDetailScreenProps {
  categoryId: string;
}

export function CategoryDetailScreen({
  categoryId,
}: CategoryDetailScreenProps) {
  const router = useRouter();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);

  const {
    data: category,
    isLoading,
    refetch,
  } = useCategory(categoryId, {
    includeDeleted: true,
  });
  const { data: subcategories, isLoading: subcategoriesLoading } =
    useSubcategories(categoryId);

  const deleteCategory = useDeleteCategory();
  const restoreCategory = useRestoreCategory();

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
    return <CategoryDetailSkeleton />;
  }

  if (!category) {
    return (
      <div className="space-y-6">
        <Text variant="h1">Categoría no encontrada</Text>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Categorías", href: "/admin/categories" },
          { label: category.name },
        ]}
      />
      <div className="flex items-center justify-between">
        <div>
          <Text variant="h1">{category.name}</Text>
          <div className="flex items-center gap-2 mt-2">
            {category.deletedAt ? (
              <Badge variant="danger" showIcon>
                Eliminada
              </Badge>
            ) : !category.isActive ? (
              <Badge variant="warning" showIcon>
                Inactiva
              </Badge>
            ) : (
              <Badge variant="success" showIcon>
                Activa
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => router.back()}>
            Volver
          </Button>
          {category.deletedAt ? (
            <Button
              variant="ghost"
              onClick={() => setShowRestoreModal(true)}
              disabled={restoreCategory.isPending}
            >
              {restoreCategory.isPending ? "Restaurando..." : "Restaurar"}
            </Button>
          ) : (
            <>
              <Button
                variant="ghost"
                onClick={() =>
                  router.push(`/admin/categories/${categoryId}/edit`)
                }
              >
                Editar
              </Button>
              <Button
                variant="danger"
                onClick={() => setShowDeleteModal(true)}
                disabled={deleteCategory.isPending}
              >
                {deleteCategory.isPending ? "Eliminando..." : "Eliminar"}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Category Information */}
      <Card className="p-6">
        <Text variant="h2" className="mb-4">
          Información
        </Text>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Text variant="small" className="text-gray-600">
              Nombre
            </Text>
            <Text variant="body">{category.name}</Text>
          </div>
          <div>
            <Text variant="small" className="text-gray-600">
              Clave
            </Text>
            <Text variant="body">{category.key}</Text>
          </div>
          <div>
            <Text variant="small" className="text-gray-600">
              Slug
            </Text>
            <Text variant="body">{category.slug}</Text>
          </div>
          <div>
            <Text variant="small" className="text-gray-600">
              Orden de clasificación
            </Text>
            <Text variant="body">{category.sortOrder}</Text>
          </div>
          {category.iconName && (
            <div>
              <Text variant="small" className="text-gray-600">
                Icono
              </Text>
              <Text variant="body">{category.iconName}</Text>
            </div>
          )}
          {category.description && (
            <div className="md:col-span-2">
              <Text variant="small" className="text-gray-600">
                Descripción
              </Text>
              <Text variant="body">{category.description}</Text>
            </div>
          )}
          <div>
            <Text variant="small" className="text-gray-600">
              Creada
            </Text>
            <Text variant="body">{formatDate(category.createdAt)}</Text>
          </div>
          <div>
            <Text variant="small" className="text-gray-600">
              Última actualización
            </Text>
            <Text variant="body">{formatDate(category.updatedAt)}</Text>
          </div>
          {category.deletedAt && (
            <div>
              <Text variant="small" className="text-gray-600">
                Eliminada
              </Text>
              <Text variant="body">{formatDate(category.deletedAt)}</Text>
            </div>
          )}
        </div>
      </Card>

      {/* Config JSON */}
      {category.configJson && Object.keys(category.configJson).length > 0 && (
        <Card className="p-6">
          <Text variant="h2" className="mb-4">
            Configuración JSON
          </Text>
          <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto text-sm">
            {JSON.stringify(category.configJson, null, 2)}
          </pre>
        </Card>
      )}

      {/* Subcategories */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <Text variant="h2">Subcategorías</Text>
          {!category.deletedAt && category.isActive && (
            <Button
              variant="ghost"
              onClick={() =>
                router.push(`/admin/subcategories/new?categoryId=${categoryId}`)
              }
            >
              Crear Subcategoría
            </Button>
          )}
        </div>
        {subcategoriesLoading ? (
          <Text variant="body" className="text-muted">
            Cargando subcategorías...
          </Text>
        ) : subcategories && subcategories.length > 0 ? (
          <div className="space-y-2">
            {subcategories.map((subcategory) => (
              <div
                key={subcategory.id}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                onClick={() =>
                  router.push(`/admin/subcategories/${subcategory.id}`)
                }
              >
                <div>
                  <Text variant="body" className="font-medium">
                    {subcategory.name}
                  </Text>
                  {subcategory.description && (
                    <Text variant="small" className="text-gray-500">
                      {subcategory.description}
                    </Text>
                  )}
                </div>
                <Badge
                  variant={subcategory.isActive ? "success" : "warning"}
                  showIcon
                >
                  {subcategory.isActive ? "Activa" : "Inactiva"}
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <Text variant="body" className="text-muted">
            No hay subcategorías para esta categoría.
          </Text>
        )}
      </Card>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <ConfirmModal
          title="Eliminar Categoría"
          message={`¿Estás seguro de que querés eliminar la categoría "${category.name}"? Esta acción es reversible (soft delete).`}
          confirmLabel="Eliminar"
          onConfirm={async () => {
            try {
              await deleteCategory.mutateAsync({ id: categoryId });
              setShowDeleteModal(false);
              refetch();
            } catch (error) {
              console.error("Error deleting category:", error);
            }
          }}
          onCancel={() => setShowDeleteModal(false)}
          isPending={deleteCategory.isPending}
          variant="danger"
        />
      )}

      {/* Restore Confirmation Modal */}
      {showRestoreModal && (
        <ConfirmModal
          title="Restaurar Categoría"
          message={`¿Estás seguro de que querés restaurar la categoría "${category.name}"?`}
          confirmLabel="Restaurar"
          onConfirm={async () => {
            try {
              await restoreCategory.mutateAsync({ id: categoryId });
              setShowRestoreModal(false);
              refetch();
            } catch (error) {
              console.error("Error restoring category:", error);
            }
          }}
          onCancel={() => setShowRestoreModal(false)}
          isPending={restoreCategory.isPending}
          variant="primary"
        />
      )}
    </div>
  );
}
